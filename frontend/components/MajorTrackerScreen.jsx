import React, { useState } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';
import ThreeDScreen from './ThreeDScreen';

const peopleImages = [
    require('../assets/people/nomi.jpeg'),
    require('../assets/people/naila.jpeg'),
    require('../assets/people/julia.jpeg'),
    require('../assets/people/aiji.jpeg'),
    require('../assets/people/ria.jpeg'),
    require('../assets/people/aldrin.jpeg'),
    require('../assets/people/noah.jpeg'),
    require('../assets/people/subham.jpeg'),
    require('../assets/people/jeff.jpeg'),
    require('../assets/people/alp.jpeg'),
    require('../assets/people/bonnie.jpeg'),
    require('../assets/people/mo.jpeg'),
    require('../assets/people/dennis.jpg'),
];

export default function MajorTrackerScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % peopleImages.length);
    };

    return (
        <View style={{ flex: 1 }}>
            <ThreeDScreen key={currentIndex} image={peopleImages[currentIndex]} />
            <View style={styles.buttonContainer}>
                <Button title="Next Image" onPress={handleNext} color="#3B82F6" />
            </View>
            <Text style={styles.comingSoon}>COMING SOON</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    comingSoon: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
});