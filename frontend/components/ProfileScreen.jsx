import React from 'react';
import { SafeAreaView, Text, Button, StyleSheet } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

export default function ProfileScreen( {user} ) {
  const signOut = async () => {
    try {
        await GoogleSignin.signOut();
        auth().signOut();
    } catch (e) {
        console.log('Sign-out error:', e);
    }
};

console.log(user);

  return (
    <SafeAreaView style={styles.container}>
      <Button onPress={signOut} title="Sign Out" />
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
container: {
  flex: 1,                  // Take up the full screen
  justifyContent: 'center',  // Center vertically
  alignItems: 'center',      // Center horizontally
},
});