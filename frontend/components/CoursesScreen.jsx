import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

const CoursesScreen = ( {user} ) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const personalAccessToken = "1072~Nx2fw7VXFTARmkfuFKQcmQH34zQ7kxGuz46F9EEXF8ZkhaM7wTywkf4cTTkKmAVk";

  async function fetchCourses(user) {
    try {
      const response = await fetch(`http://10.40.137.71:8000/get_user_courses?user_id=${user.uid}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setClasses(data);
      } else {
        console.error('Unexpected data format:', data);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }
  

  useEffect(() => {
    fetchCourses(user);
  }, []);

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

      const response = await fetch('http://10.40.137.71:8000/syllabus-parse', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log('Response:', data);
      Alert.alert('Success', 'File uploaded successfully.');
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload the file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classes</Text>
      <ScrollView contentContainerStyle={styles.buttonContainer}>
        {classes.map((className, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => navigation.navigate('CourseDetails', { className })}
          >
            <Text style={styles.buttonText}>
              {className.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Upload Button after the classes */}
        <TouchableOpacity
          onPress={pickDocument}
          style={[styles.button, { backgroundColor: '#28a745', marginTop: 30 }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Upload Syllabus File</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CoursesScreen;
