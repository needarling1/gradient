import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UploadProfileScreen from './UploadProfileScreen';
import PersonalInfoScreen from './PersonalInfoScreen';
import AcademicInfoScreen from './AcademicInfoScreen';
import BcoursesTokenScreen from './BcoursesTokenScreen';
import ReviewAndSubmitScreen from './ReviewAndSubmitScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Stack = createNativeStackNavigator();

export default function OnboardingNavigator({ onComplete }) {
  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: '',
    lastName: '',
    major: '',
    department: '',
    gpa: '',
    graduationYear: '',
    bcourseToken: '',
  });

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UploadProfile">
        {(props) => <UploadProfileScreen {...props} formData={formData} updateFormData={updateFormData} />}
      </Stack.Screen>
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
        onComplete={async (data) => {
          await AsyncStorage.setItem('hasOnboarded', 'true'); 
          onComplete(data); 
        }}
      />
    )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
