import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function LandingScreen({ onSignIn }) {
    return (
        <View style={styles.container}>
          {/* Top Left Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.circle}>
              <Text style={styles.iconText}>🎓</Text> {/* You can use an icon here instead */}
            </View>
          </View>
    
          {/* Illustration */}
          <Image
            source={require('./assets/graduation_illustration.png')} // <- Make sure this image exists
            style={styles.image}
            resizeMode="contain"
          />
    
          {/* Title Text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Smarter school
            </Text>
            <Text style={styles.title}>
              starts here<Text style={styles.dot}>.</Text>
            </Text>
          </View>
    
          {/* Get Started Button */}
          <TouchableOpacity style={styles.button} onPress={onSignIn}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
      alignItems: 'center',
      paddingTop: 50,
    },
    iconContainer: {
      position: 'absolute',
      top: 40,
      left: 20,
    },
    circle: {
      backgroundColor: '#E0ECFD',
      borderRadius: 30,
      padding: 10,
    },
    iconText: {
      fontSize: 24,
    },
    image: {
      width: '80%',
      height: 250,
      marginTop: 80,
    },
    textContainer: {
      marginTop: 40,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.2)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    dot: {
      color: '#3B82F6',
    },
    button: {
      backgroundColor: '#3B82F6',
      borderRadius: 30,
      paddingVertical: 12,
      paddingHorizontal: 40,
      marginTop: 50,
      elevation: 5,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
    },
  });