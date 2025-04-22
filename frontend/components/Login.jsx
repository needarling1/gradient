// components/Login.jsx
import React from 'react';
import { View, Alert } from 'react-native';
import { GoogleSignin, statusCodes, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';


const Login = ({ onLogin }) => {
    async function onGoogleButtonPress() {
        // Check if your device supports Google Play
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        // Get the users ID token
        const signInResult = await GoogleSignin.signIn();
        
        // Try the new style of google-sign in result, from v13+ of that module
        idToken = signInResult.data?.idToken;
        if (!idToken) {
            // if you are using older versions of google-signin, try old style result
            idToken = signInResult.idToken;
        }
        if (!idToken) {
            throw new Error('No ID token found');
        }
        
        // Create a Google credential with the token
        const googleCredential = auth.GoogleAuthProvider.credential(signInResult.data.idToken);
        
        // Sign-in the user with the credential
        return auth().signInWithCredential(googleCredential);
        }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={onGoogleButtonPress()}
      />
    </View>
  );
};

export default Login;
