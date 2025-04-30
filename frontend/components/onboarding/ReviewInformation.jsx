import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ReviewInformation = ({ 
  navigation, 
  formData = {
    firstName: '',
    lastName: '',
    profileImage: null,
    majors: [],
    departments: [],
    gpa: '',
    graduationYear: '',
    bcoursesToken: '',
  }
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderInfoItem = (label, value, icon) => (
    <Animated.View
      style={[
        styles.infoCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.infoHeader}>
        <Ionicons name={icon} size={20} color="#3B82F6" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>
        {Array.isArray(value) ? value.join(', ') : value || 'Not specified'}
      </Text>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Review Information</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={
              formData.profileImage
                ? { uri: formData.profileImage }
                : require('../../assets/images/default_avatar.png')
            }
            style={styles.profileImage}
          />
          <Text style={styles.name}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>

        <View style={styles.infoSection}>
          {renderInfoItem('Major(s)', formData.majors, 'school-outline')}
          {renderInfoItem('Department(s)', formData.departments, 'business-outline')}
          {renderInfoItem('GPA', formData.gpa, 'stats-chart-outline')}
          {renderInfoItem('Graduation Year', formData.graduationYear, 'calendar-outline')}
          {renderInfoItem('bCourses Token', '••••••••', 'key-outline')}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => {
            // Handle submission
          }}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 