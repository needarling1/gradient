import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Button, Image, Dimensions } from 'react-native';
import ThreeDScreen from './ThreeDScreen';
import { Audio } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

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

const songFiles = [
    { label: 'dont.mp3', value: require('../assets/songs/dont.mp3') },
    { label: 'dieforyou.mp3', value: require('../assets/songs/dieforyou.mp3') },
    { label: 'twenties.mp3', value: require('../assets/songs/twenties.mp3') },
    { label: 'snooze.mp3', value: require('../assets/songs/snooze.mp3') },
    { label: 'chickenjockey.mp3', value: require('../assets/songs/chickenjockey.mp3') },
    { label: 'bestpart.mp3', value: require('../assets/songs/bestpart.mp3') },
];

export default function MajorTrackerScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [bgIndex, setBgIndex] = useState(0);
    const [selectedSong, setSelectedSong] = useState(songFiles[0].value);
    const [selectedSongLabel, setSelectedSongLabel] = useState(songFiles[0].label);
    const intervalRef = useRef(null);
    const isFocused = useIsFocused();
    const soundRef = useRef(null);

    // Cycle background images every 3s
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % peopleImages.length);
        }, 3000);
        return () => clearInterval(intervalRef.current);
    }, []);

    // Play audio when tab is focused or song changes
    useEffect(() => {
        async function playAudio() {
            if (isFocused) {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                }
                const { sound } = await Audio.Sound.createAsync(
                    selectedSong,
                    { shouldPlay: true }
                );
                soundRef.current = sound;
            } else {
                if (soundRef.current) {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }
            }
        }
        playAudio();
        return () => {
            if (soundRef.current) {
                soundRef.current.stopAsync();
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        };
    }, [isFocused, selectedSong]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % peopleImages.length);
    };

    return (
        <View style={{ flex: 1 }}>
            <Image
                source={peopleImages[bgIndex]}
                style={styles.background}
                resizeMode="cover"
                blurRadius={2}
            />
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedSongLabel}
                    style={styles.picker}
                    onValueChange={(itemValue, itemIndex) => {
                        setSelectedSong(songFiles[itemIndex].value);
                        setSelectedSongLabel(itemValue);
                    }}
                    mode="dropdown"
                >
                    {songFiles.map((song) => (
                        <Picker.Item key={song.label} label={song.label} value={song.label} />
                    ))}
                </Picker>
            </View>
            <ThreeDScreen key={currentIndex} image={peopleImages[currentIndex]} />
            <View style={styles.buttonContainer}>
                <Button title="Next Image" onPress={handleNext} color="#3B82F6" />
            </View>
            <Text style={styles.comingSoon}>COMING SOON</Text>
        </View>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    background: {
        position: 'absolute',
        width,
        height,
        top: 0,
        left: 0,
        zIndex: 0,
    },
    pickerContainer: {
        position: 'absolute',
        top: 40,
        right: 10,
        width: 180,
        zIndex: 3,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
    },
    picker: {
        color: '#fff',
        width: 180,
        height: 44,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 2,
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
        zIndex: 2,
    },
});