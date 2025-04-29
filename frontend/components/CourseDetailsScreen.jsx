import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const CourseDetailsScreen = ({ user, route }) => {
  const { className, id } = route.params;
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
    fetchAssignments(id, user.id);
  }, [className]);

  const fetchCourseDetails = async () => {
    try {
      setLoadingCourseDetails(true);
      const response = await fetch(`http://10.2.14.234:8000/user_course/${user.uid}/${id}`);
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

  const fetchAssignments = async (courseId, userId) => {
    try {
      setLoadingAssignments(true);
      setAssignments([]);
      const response = await fetch(`http://10.2.14.234:8000/get_assignments?course_id=${courseId}&user_id=${userId}`);
      const data = await response.json();
      console.log(data.assignments)
      setAssignments(data.assignments);
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

      const response = await fetch('http://10.2.14.234:8000/syllabus-parse', {
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

  const AssignmentItem = ({ assignment }) => {
    return (
      <View style={styles.assignmentCard}>
        <Text style={styles.assignmentTitle}>{assignment.name}</Text>
        {assignment.score !== undefined ? (
          <Text style={styles.assignmentScore}>
            {assignment.score} / {assignment.points_possible}
          </Text>
        ) : (
          <Text style={styles.assignmentScore}>Not yet graded</Text>
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

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.courseTitle}>{className.replace('_', ' ')}</Text>

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
});

export default CourseDetailsScreen;
