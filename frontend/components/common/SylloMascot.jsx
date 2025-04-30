import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Animated } from 'react-native';

export const SylloMascot = ({ style, animation = 'idle' }) => {
  const bounceValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (animation === 'bounce') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animation]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { transform: [{ translateY: bounceValue }] }
      ]}
    >
      <Image
        source={require('../../assets/images/syllo_mascot.png')}
        style={styles.mascot}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascot: {
    width: 200,
    height: 200,
  },
}); 