import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Button } from 'react-native';
import * as ImagePicker from 'react-native-image-picker';

export default function UploadProfileScreen({ navigation, formData, updateFormData }) {
  const pickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && !response.errorCode) {
        updateFormData({ profileImage: response.assets[0].uri });
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Your Profile Picture</Text>
      {formData.profileImage && (
        <Image source={{ uri: formData.profileImage }} style={styles.avatar} />
      )}
      <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
        <Text style={styles.uploadText}>Choose Photo</Text>
      </TouchableOpacity>
      <Button
        title="Next"
        onPress={() => navigation.navigate('PersonalInfo')}
        disabled={!formData.profileImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  uploadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});