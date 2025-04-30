
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  GoogleSigninButton
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import AppContent from './AppContent';
import LandingScreen from './components/LandingScreen';
import SplashScreen from './components/SplashScreen';
import Animated, { SlideInUp } from 'react-native-reanimated';
import OnboardingNavigator from './components/OnboardingNav';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const index = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const [showSplash, setShowSplash] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(null); 

  GoogleSignin.configure({
    webClientId: '817318853256-4q5u1t8o277kt39a57gfvms6q56ueg2b.apps.googleusercontent.com',
  });

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      console.log('response', response);
      const googleCredential = auth.GoogleAuthProvider.credential(response.data?.idToken);
      return auth().signInWithCredential(googleCredential);
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            break;
          default:
        }
      } else {
      }
    }
  };

  async function createUserIfNotExists(user) {
    try {
      const response = await fetch('http://10.40.141.162:8000/create_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();
      console.log('User creation response:', data);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async function onAuthStateChanged(user) {
    setUser(user);
    if (user) {
      await createUserIfNotExists(user);  // call new API here
    }
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const checkOnboardingStatus = async () => {
      const onboarded = await AsyncStorage.getItem('hasOnboarded'); // ✅ NEW
      setHasOnboarded(onboarded === 'true');
    };

    checkOnboardingStatus(); // ✅ NEW

    return () => {
      subscriber();
      clearTimeout(splashTimer);
    };
  }, []);

  if (initializing || showSplash || hasOnboarded === null) return <SplashScreen />; // ✅ MODIFIED

  if (!user) {
    return (
      <Animated.View entering={SlideInUp.duration(800)} style={{ flex: 1 }}>
        <LandingScreen onSignIn={signIn} />
      </Animated.View>
    );
  }

  if (user && !hasOnboarded) { // ✅ MODIFIED
    return (
      <NavigationContainer>
        <OnboardingNavigator
          onComplete={(profile) => {
            setUserProfile(profile);
            setHasOnboarded(true); // ✅ NEW
          }}
        />
      </NavigationContainer>
    );
  }

  return (
    <AppContent user={user} userProfile={userProfile} />
  );
}

export default index;