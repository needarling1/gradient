import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

const CoursesScreen = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseGrades, setCourseGrades] = useState({});
  const navigation = useNavigation();

  async function fetchCoursesAndGrades(user) {
    try {
      const response = await fetch(`http://10.2.14.245:8000/get_user_courses?user_id=${user.uid}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCourses(data);
        // Fetch predicted grades for each course
        data.forEach(async (course) => {
          try {
            const resp = await fetch(`http://10.2.14.245:8000/user_course/${user.uid}/${course.course_code}`);
            const courseData = await resp.json();
            if (courseData.course_found && courseData.course_data && courseData.course_data.predicted_grade !== undefined) {
              setCourseGrades(prev => ({ ...prev, [course.course_code]: courseData.course_data.predicted_grade }));
            }
          } catch (e) {
            // Ignore errors for missing course details
          }
        });
      } else {
        console.error('Unexpected data format:', data);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      fetchCoursesAndGrades(user);
    }, [user])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classes</Text>

      <ScrollView contentContainerStyle={styles.buttonContainer}>
        {courses.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.button}
            onPress={() => navigation.navigate('CourseDetails', { id: course.id, className: course.course_code })}
          >
            <Text style={styles.buttonText}>
              {course.course_code.replace('_', ' ')}
              {courseGrades[course.course_code] !== undefined && (
                <Text style={styles.gradeText}>  {courseGrades[course.course_code] !== null ? `${courseGrades[course.course_code].toFixed(2)}%` : 'N/A'}</Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: 'center',  // ⬅️ center vertically
    alignItems: 'center',       // ⬅️ center horizontally
    paddingTop: 80,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: { 
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    width: 250,              // ⬅️ Wider buttons look better centered
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
  gradeText: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CoursesScreen;
