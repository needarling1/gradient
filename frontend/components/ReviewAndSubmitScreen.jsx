import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BACKEND_URL } from '../config';

export default function ReviewAndSubmitScreen({ navigation, formData, onComplete, userId }) {
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

  const handleSubmit = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User ID is required to complete onboarding');
        return;
      }

      // Ensure majors and departments are always arrays and departments is flat
      const flatten = (arr) => Array.isArray(arr) ? arr.flat(Infinity) : [];
      const payload = {
        user_id: userId,
        ...formData,
        majors: Array.isArray(formData.majors) ? formData.majors : [],
        departments: flatten(formData.departments),
      };
      console.log('Submitting onboarding data:', payload);

      const response = await fetch(`${BACKEND_URL}/onboard_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }

      await response.json();
      console.log('Onboarding data saved successfully');
      
      if (onComplete) {
        onComplete(formData);
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
      Alert.alert(
        'Error',
        'Failed to complete onboarding. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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

      <View style={styles.mainContent}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.profileSection}>
            {formData.profileImage ? (
              <Image
                source={{ uri: formData.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.defaultAvatar]}>
                <Ionicons name="person" size={50} color="#3B82F6" />
              </View>
            )}
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
        </ScrollView>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  defaultAvatar: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  infoSection: {
    gap: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingBottom: 0,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginLeft: 32,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 1,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
