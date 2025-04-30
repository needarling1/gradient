import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IntroSlides } from './IntroSlides';

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleIntroComplete = () => {
    navigation.navigate('PersonalInfo');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <IntroSlides onComplete={handleIntroComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
}); 