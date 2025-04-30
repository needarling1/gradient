import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import LinearGradient from 'react-native-linear-gradient';

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
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Track your courses and grades</Text>
      <ScrollView contentContainerStyle={styles.cardsContainer}>
        <View style={styles.rowContainer}>
          {courses.map((course, idx) => (
            <View key={course.id} style={styles.cardColumn}>
              <TouchableOpacity
                style={styles.cardWrapper}
                onPress={() => navigation.navigate('CourseDetails', { id: course.id, className: course.course_code })}
              >
                <View style={styles.card}>
                  <LinearGradient
                    colors={["#2196F3", "#1565C0"]}
                    style={styles.cardTop}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.gradeText}>
                      {courseGrades[course.course_code] !== undefined
                        ? `${courseGrades[course.course_code].toFixed(2)}%`
                        : 'N/A'}
                    </Text>
                  </LinearGradient>
                  <View style={styles.cardBottom}>
                    <Text style={styles.courseCode}>{course.course_code.replace('_', ' ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    color: '#222',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'left',
  },
  subtitle: {
    color: '#555',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'left',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  cardColumn: {
    width: '46%',
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: '2%',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    minHeight: 240,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 0, 
    shadowColor: '#000',
    shadowOpacity: 0.2, 
    shadowRadius: 2,    
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginVertical: 10,
  },
  cardTop: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardBottom: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 0,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e3eafc',
  },
  gradeText: {
    color: '#fff',
    fontSize: 38,
    letterSpacing: 1,
    textShadowColor: 'rgba(21,101,192,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  courseCode: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 400,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default CoursesScreen;
