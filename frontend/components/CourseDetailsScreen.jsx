import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

const CourseDetailsScreen = ({ user, route }) => {
  const { className } = route.params;
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(true); // <--- new

  useEffect(() => {
    fetchCourseDetails();
  }, [className]);

  const fetchCourseDetails = async () => {
    try {
      setLoadingCourseDetails(true);
      const response = await fetch(`http://10.40.137.71:8000/user_course/${user.uid}/${className}`);
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

      const response = await fetch('http://10.40.137.71:8000/syllabus-parse', {
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

  // While loading course details from Firestore
  if (loadingCourseDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // No course details found after loading
  if (!courseDetails) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  // Course details found
  return (
    <View style={styles.container}>
      <Text style={styles.courseTitle}>{courseDetails.course_name}</Text>
      <ScrollView contentContainerStyle={styles.detailsContainer}>
        <Section title="Emails" data={courseDetails.emails} />
        <Section title="Grade Breakdown" data={courseDetails.grade_breakdown} />
        <Section title="Important Dates" data={courseDetails.important_dates} />
        <Section title="Office Hours" data={courseDetails.office_hours} />
      </ScrollView>
    </View>
  );
};

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
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
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
});

export default CourseDetailsScreen;
