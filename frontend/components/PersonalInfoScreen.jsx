import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function PersonalInfoScreen({ navigation, formData, updateFormData }) {
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState({});
  const [firstName, setFirstName] = useState(formData.firstName || '');
  const [lastName, setLastName] = useState(formData.lastName || '');
  const [profileImage, setProfileImage] = useState(formData.profileImage || null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to upload a profile picture!');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        updateFormData({
          ...formData,
          profileImage: result.assets[0].uri
        });
      }
    } catch (error) {
      console.log('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const validateName = (value, field) => {
    // Only allow letters and spaces
    if (!/^[a-zA-Z\s]*$/.test(value)) {
      return;
    }

    if (field === 'firstName') {
      setFirstName(value);
      if (value.trim().length === 0) {
        setErrors(prev => ({ ...prev, firstName: 'First name is required' }));
      } else {
        setErrors(prev => ({ ...prev, firstName: null }));
      }
      updateFormData({
        ...formData,
        firstName: value
      });
    } else {
      setLastName(value);
      if (value.trim().length === 0) {
        setErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
      } else {
        setErrors(prev => ({ ...prev, lastName: null }));
      }
      updateFormData({
        ...formData,
        lastName: value
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'Please enter your first name';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Please enter your last name';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      navigation.navigate('AcademicInfo');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 3</Text>
        </View>
      </View>

      <Text style={styles.title}>Personal Information</Text>

      <View style={styles.profileImageContainer}>
        <View style={styles.imageWrapper}>
          <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="camera" size={32} color="#A1A1A1" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.plusButton}>
            <Ionicons name="add-circle-sharp" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.section}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            placeholder="Enter your first name"
            style={[styles.input, errors.firstName && styles.inputError]}
            value={firstName}
            onChangeText={(value) => validateName(value, 'firstName')}
            autoCapitalize="words"
            autoCorrect={false}
            placeholderTextColor="#A1A1A1"
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            placeholder="Enter your last name"
            style={[styles.input, errors.lastName && styles.inputError]}
            value={lastName}
            onChangeText={(value) => validateName(value, 'lastName')}
            autoCapitalize="words"
            autoCorrect={false}
            placeholderTextColor="#A1A1A1"
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!firstName.trim() || !lastName.trim()) && styles.buttonDisabled
        ]}
        onPress={handleNext}
        disabled={!firstName.trim() || !lastName.trim()}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
  },
  progress: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 32,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  imagePickerButton: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  plusButton: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: '#A1A1A1',
    fontSize: 14,
    marginTop: 4,
  },
  inputContainer: {
    gap: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A1A1A1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
}); 