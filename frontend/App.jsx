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

const index = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

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
      const response = await fetch('http://10.2.115.245:8000/create_user', {
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
    return subscriber;
  }, []);

  if (initializing) return null;


  console.log(user);
  if (!user) {
    return (
      <LandingScreen onSignIn={signIn} />
    )
  }

  return (
    <AppContent user={user}/>
  );
}

export default index