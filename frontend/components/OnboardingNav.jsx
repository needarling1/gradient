import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonalInfoScreen from './PersonalInfoScreen';
import AcademicInfoScreen from './AcademicInfoScreen';
import BcoursesTokenScreen from './BcoursesTokenScreen';
import ReviewAndSubmitScreen from './ReviewAndSubmitScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator({ onComplete, userId }) {
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    lastName: '',
    majors: [],
    departments: [],
    gpa: '',
    graduationYear: '',
    bcourseToken: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        if (!userId) {
          setIsLoading(false);
          return;
        }

        const response = await fetch(`http://10.2.14.245:8000/check_onboarding/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to check onboarding status');
        }

        const data = await response.json();
        console.log('Onboarding check result:', data);
        if (data.hasOnboarded && data.userData) {
          setFormData(data.userData);
          onComplete(data.userData);
        } else {
          // Not onboarded, show onboarding screens
          setFormData({
            profileImage: null,
            firstName: '',
            lastName: '',
            majors: [],
            departments: [],
            gpa: '',
            graduationYear: '',
            bcourseToken: '',
          });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [userId]);

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Debug: log when onboarding screens are shown
  if (!formData.firstName && !formData.lastName) {
    console.log('Onboarding screens are being shown (user not onboarded)');
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PersonalInfo">
        {(props) => <PersonalInfoScreen {...props} formData={formData} updateFormData={updateFormData} />}
      </Stack.Screen>
      <Stack.Screen name="AcademicInfo">
        {(props) => <AcademicInfoScreen {...props} formData={formData} updateFormData={updateFormData} />}
      </Stack.Screen>
      <Stack.Screen name="BcoursesToken">
        {(props) => <BcoursesTokenScreen {...props} formData={formData} updateFormData={updateFormData} />}
      </Stack.Screen>
      <Stack.Screen name="Review">
        {(props) => (
          <ReviewAndSubmitScreen
            {...props}
            formData={formData}
            onComplete={onComplete}
            userId={userId}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
