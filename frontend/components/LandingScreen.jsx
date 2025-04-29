import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function LandingScreen({ onSignIn }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
    Animated.loop(
        Animated.sequence([
        Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }),
        ])
    ).start();
    }, []);

    return (
        <View style={styles.container}>
          {/* Illustration */}
          <Animated.Image
            source={require('../assets/images/graduation_illustration.png')}
            style={[styles.image, { transform: [{ scale: scaleAnim }] }]}
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
      backgroundColor: '#FFFFFF', // white background
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 80, // more breathing room
    },
    image: {
      width: '70%',
      height: 300,
      marginTop: 85,
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    textContainer: {
      marginTop: 30,
      alignItems: 'center',
    },
    title: {
      fontSize: 40,
      fontWeight: 'bold',
      color: '#111827', // dark text
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 6,
    },
    dot: {
      color: '#3B82F6', // blue dot
    },
    button: {
      marginTop: 40,
      backgroundColor: '#3B82F6',
      borderRadius: 50,
      paddingVertical: 14,
      paddingHorizontal: 50,
      elevation: 10, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 15,
    },
  });