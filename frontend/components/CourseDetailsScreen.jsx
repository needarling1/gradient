import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import SegmentedControlTab from 'react-native-segmented-control-tab';

const CourseDetailsScreen = ({ user, route }) => {
  const { className, id } = route.params;
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [gradeStyle, setGradeStyle] = useState('raw');
  const [gradePlatform, setGradePlatform] = useState('canvas');
  const [predictedGrade, setPredictedGrade] = useState(null);
  const [updatingGrade, setUpdatingGrade] = useState(false);

  const gradeStyleOptions = ['Raw', 'Curved (Median)'];
  const gradePlatformOptions = ['Canvas', 'Gradescope'];

  useEffect(() => {
    fetchCourseDetails();
    fetchAllAssignments(id, user.id);
  }, [className]);

  useEffect(() => {
    if (courseDetails) {
      setGradeStyle(courseDetails.grade_style || 'raw');
      setGradePlatform(courseDetails.grade_platform || 'canvas');
      setPredictedGrade(courseDetails.predicted_grade || null);
    }
  }, [courseDetails]);

  const fetchCourseDetails = async () => {
    try {
      setLoadingCourseDetails(true);
      const response = await fetch(`http://10.2.14.245:8000/user_course/${user.uid}/${className}`);
      const data = await response.json();
      if (data.course_found) {
        setCourseDetails(data.course_data);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoadingCourseDetails(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      console.log('File Selected:', file);
      uploadFile(file);
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick a file.');
    }
  };

  const fetchAllAssignments = async (courseId, userId) => {
    try {
      setLoadingAssignments(true);
      setAssignments([]);
      
      // Fetch both Canvas and Gradescope assignments in parallel
      const [canvasResponse, gradescopeResponse] = await Promise.all([
        fetch(`http://10.2.14.245:8000/get_assignments?course_id=${courseId}&user_id=${userId}`),
        fetch(`http://10.2.14.245:8000/get_gradescope_assignments?course_id=${courseId}`)
      ]);

      const canvasData = await canvasResponse.json();
      const gradescopeData = await gradescopeResponse.json();

      // Combine assignments from both sources
      const allAssignments = [
        ...canvasData.assignments,
        ...gradescopeData.assignments
      ];

      setAssignments(allAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const uploadFile = async (file) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('syllabus', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
      formData.append('user_id', user.uid);
      formData.append('class_name', className);

      const response = await fetch('http://10.2.14.245:8000/syllabus-parse', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('Upload response:', data);
      Alert.alert('Success', 'File uploaded successfully.');

      // ⬇️ Immediately re-fetch the course details after upload
      await fetchCourseDetails();

    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload the file.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePredictedGrade = async () => {
    if (!courseDetails || !assignments.length) return;

    setUpdatingGrade(true);
    try {
      // First update the grade options
      await fetch('http://10.2.14.245:8000/update_course_grade_options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          class_name: className,
          grade_style: gradeStyle,
          grade_platform: gradePlatform,
        }),
      });

      // Then calculate grade locally
      const gradeBreakdown = courseDetails.grade_breakdown || {};
      
      // Categorize assignments
      const categorizeAssignment = (assignmentName) => {
        const name = assignmentName.toLowerCase();
        for (const category of Object.keys(gradeBreakdown)) {
          if (name.includes(category.toLowerCase())) {
            return category;
          }
        }
        // fallback: try to guess
        if (name.includes('quiz')) return 'quizzes';
        if (name.includes('homework') || name.includes('hw')) return 'homework';
        if (name.includes('midterm')) {
          return name.includes('1') ? 'midterm_1' : (name.includes('2') ? 'midterm_2' : 'midterm');
        }
        if (name.includes('final')) return 'final';
        return null;
      };

      // Group assignments by category
      const categoryScores = {};
      assignments.forEach(assignment => {
        if (assignment.score !== undefined && assignment.points_possible) {
          const category = categorizeAssignment(assignment.name);
          if (!category) return;
          
          const percent = (assignment.score / assignment.points_possible) * 100;
          if (!categoryScores[category]) {
            categoryScores[category] = [];
          }
          categoryScores[category].push(percent);
        }
      });

      // Compute averages per category
      const categoryAverages = {};
      Object.entries(categoryScores).forEach(([category, scores]) => {
        if (scores.length > 0) {
          categoryAverages[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
      });

      // Calculate weighted average
      let weightedSum = 0;
      let usedWeights = 0;
      Object.entries(categoryAverages).forEach(([category, avg]) => {
        const weightStr = gradeBreakdown[category];
        if (!weightStr) return;
        const weight = parseFloat(weightStr.replace('%', ''));
        weightedSum += avg * weight;
        usedWeights += weight;
      });

      let calculatedGrade = null;
      if (usedWeights > 0) {
        calculatedGrade = weightedSum / usedWeights;
      }

      // Apply curve if selected
      if (gradeStyle === 'curved' && calculatedGrade !== null) {
        calculatedGrade = 85.0; // Simulate curve by treating as median (B-level)
      }

      setPredictedGrade(calculatedGrade);

      // Save the predicted grade to backend
      await fetch('http://10.2.14.245:8000/set_predicted_grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          class_name: className,
          predicted_grade: calculatedGrade,
        }),
      });

    } catch (error) {
      console.error('Error calculating grade:', error);
      Alert.alert('Error', 'Failed to calculate grade. Please try again.');
    } finally {
      setUpdatingGrade(false);
    }
  };

  const AssignmentItem = ({ assignment }) => {
    return (
      <View style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <Text style={styles.assignmentTitle}>{assignment.name}</Text>
        </View>
        {assignment.score !== undefined ? (
          <Text style={styles.assignmentScore}>
            {assignment.score} / {assignment.points_possible}
          </Text>
        ) : (
          <Text style={styles.assignmentScore}>Not yet graded</Text>
        )}
        <Text style={[styles.sourceTag, 
            { color: assignment.source === 'canvas' ? '#2D9CDB' : '#27AE60' }]}>
            {assignment.source}
          </Text>
      </View>
    );
  };
  
  // Helper to render course info prettily
  const renderCourseInfo = () => {
    if (!courseDetails) return null;
    return (
      <View style={styles.courseInfoCard}>
        {courseDetails.emails && (
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Contacts</Text>
            {Object.entries(courseDetails.emails).map(([role, email]) => (
              <Text key={role} style={styles.infoSectionText}>
                {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {email}
              </Text>
            ))}
          </View>
        )}
        {courseDetails.grade_breakdown && (
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Grade Breakdown</Text>
            {Object.entries(courseDetails.grade_breakdown).map(([k, v]) => (
              <Text key={k} style={styles.infoSectionText}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {v}</Text>
            ))}
          </View>
        )}
        {courseDetails.important_dates && (
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Important Dates</Text>
            {Object.entries(courseDetails.important_dates).map(([k, v]) => (
              <Text key={k} style={styles.infoSectionText}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {v}</Text>
            ))}
          </View>
        )}
        {courseDetails.office_hours && (
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Office Hours</Text>
            {Object.entries(courseDetails.office_hours).map(([k, v]) => (
              <Text key={k} style={styles.infoSectionText}>{k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {v}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loadingCourseDetails || loadingAssignments) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // If no syllabus uploaded, only show upload button
  if (!courseDetails) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.courseTitle}>{className.replace('_', ' ')}</Text>
        <TouchableOpacity
          onPress={pickDocument}
          style={[styles.uploadButton, { marginTop: 30 }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload Syllabus File</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Syllabus uploaded: show course info, then assignments
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.courseTitle}>{className.replace('_', ' ')}</Text>
      {/* Predicted Grade at the top */}
      <View style={styles.predictedGradeCard}>
        <Text style={styles.predictedGradeLabel}>Predicted Grade:</Text>
        {updatingGrade ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <Text style={styles.predictedGradeValue}>
            {predictedGrade !== null ? `${predictedGrade.toFixed(2)}%` : 'N/A'}
          </Text>
        )}
      </View>
      {/* Grade prediction controls */}
      <View style={styles.gradeOptionsCard}>
        <Text style={styles.gradeOptionsTitle}>Grade Prediction Options</Text>
        <View style={styles.segmentedRow}>
          <Text style={styles.pickerLabel}>Grade Style:</Text>
          <SegmentedControlTab
            values={gradeStyleOptions}
            selectedIndex={gradeStyle === 'raw' ? 0 : 1}
            onTabPress={index => {
              const value = index === 0 ? 'raw' : 'curved';
              setGradeStyle(value);
            }}
            tabsContainerStyle={styles.segmentedTab}
            tabStyle={styles.tabStyle}
            activeTabStyle={styles.activeTabStyle}
            tabTextStyle={styles.tabTextStyle}
            activeTabTextStyle={styles.activeTabTextStyle}
            enabled={!updatingGrade}
          />
        </View>
        <View style={styles.segmentedRow}>
          <Text style={styles.pickerLabel}>Platform:</Text>
          <SegmentedControlTab
            values={gradePlatformOptions}
            selectedIndex={gradePlatform === 'canvas' ? 0 : 1}
            onTabPress={index => {
              const value = index === 0 ? 'canvas' : 'gradescope';
              setGradePlatform(value);
            }}
            tabsContainerStyle={styles.segmentedTab}
            tabStyle={styles.tabStyle}
            activeTabStyle={styles.activeTabStyle}
            tabTextStyle={styles.tabTextStyle}
            activeTabTextStyle={styles.activeTabTextStyle}
            enabled={!updatingGrade}
          />
        </View>
        <TouchableOpacity
          onPress={calculatePredictedGrade}
          style={styles.calculateButton}
          disabled={updatingGrade}
        >
          {updatingGrade ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Grade</Text>
          )}
        </TouchableOpacity>
      </View>
      {renderCourseInfo()}
      <Text style={[styles.sectionTitle, {marginTop: 20}]}>Assignments</Text>
      {assignments && assignments.length > 0 ? (
        assignments.map((assignment, index) => (
          <AssignmentItem key={index} assignment={assignment} />
        ))
      ) : (
        <Text>No assignments found.</Text>
      )}
      <TouchableOpacity
        onPress={pickDocument}
        style={[styles.uploadButton, { marginTop: 30 }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Upload Syllabus File</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const formatKey = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const Section = ({ title, data }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {data &&
          Object.entries(data).map(([key, value], index) => (
            <Text key={index} style={styles.sectionText}>
              {formatKey(key)}: {value}
            </Text>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flexGrow: 1,
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
    paddingBottom: 100},
  courseTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  detailsContainer: { paddingBottom: 50 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  sectionText: { fontSize: 16, marginBottom: 5 },
  sectionContent: { paddingLeft: 10 },
  uploadButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  assignmentCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  
  assignmentScore: {
    fontSize: 16,
    color: '#555',
  },  
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceTag: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  courseInfoCard: {
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  courseInfoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 10,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  infoSectionText: {
    fontSize: 15,
    color: '#22223B',
    marginBottom: 2,
    marginLeft: 8,
  },
  gradeOptionsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  gradeOptionsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentedTab: {
    flex: 1,
    marginLeft: 10,
  },
  tabStyle: {
    borderColor: '#1565C0',
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 36,
  },
  activeTabStyle: {
    backgroundColor: '#1565C0',
  },
  tabTextStyle: {
    color: '#1565C0',
    fontWeight: '500',
  },
  activeTabTextStyle: {
    color: '#fff',
    fontWeight: '700',
  },
  predictedGradeCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    marginTop: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  predictedGradeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  predictedGradeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  calculateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CourseDetailsScreen;
