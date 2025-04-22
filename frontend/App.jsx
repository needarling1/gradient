import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Login from './components/Login';
import AppContent from './AppContent'; 

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({});

    (async () => {
      try {
        const isSignedIn = await GoogleSignin.isSignedIn;
        if (isSignedIn) {
          const userInfo = await GoogleSignin.getCurrentUser();
          setUser(userInfo);
        }
      } catch (e) {
        console.log('Error checking sign-in:', e);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? (
    <AppContent user={user} onSignOut={() => setUser(null)} />
  ) : (
    <Login onLogin={(u) => setUser(u)} />
  );
}
