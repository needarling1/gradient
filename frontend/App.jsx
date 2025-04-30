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
      const response = await fetch('http://10.2.14.245:8000/create_user', {
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

  async function checkOnboardingStatus(userId) {
    try {
      if (!userId) {
        setHasOnboarded(false);
        return;
      }
      const response = await fetch(`http://10.2.14.245:8000/check_onboarding/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to check onboarding status');
      }
      const data = await response.json();
      setHasOnboarded(!!data.hasOnboarded);
      if (data.hasOnboarded && data.userData) {
        setUserProfile(data.userData);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasOnboarded(false);
    }
  }

  async function onAuthStateChanged(user) {
    setUser(user);
    if (user) {
      await createUserIfNotExists(user);
      await checkOnboardingStatus(user.uid);
    } else {
      setHasOnboarded(null);
      setUserProfile(null);
    }
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => {
      subscriber();
      clearTimeout(splashTimer);
    };
  }, []);

  if (initializing || showSplash || hasOnboarded === null) return <SplashScreen />;

  if (!user) {
    return (
      <Animated.View entering={SlideInUp.duration(800)} style={{ flex: 1 }}>
        <LandingScreen onSignIn={signIn} />
      </Animated.View>
    );
  }

  if (user && !hasOnboarded) {
    return (
      <NavigationContainer>
        <OnboardingNavigator
          userId={user.uid}
          onComplete={(profile) => {
            setUserProfile(profile);
            setHasOnboarded(true);
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