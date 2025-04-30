import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert, TextInput, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ucBerkeleyMajors, ucBerkeleyDepartments, majorToDepartmentMapping } from '../data/ucBerkeleyData';
import { BACKEND_URL } from '../config';

const Tag = ({ text, onRemove }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{text}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.removeTag}>
      <Icon name="close" size={14} color="#6B7280" />
    </TouchableOpacity>
  </View>
);

export default function ProfileScreen({ user }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState(null);
  const [newMajor, setNewMajor] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [majorSuggestions, setMajorSuggestions] = useState([]);
  const [departmentSuggestions, setDepartmentSuggestions] = useState([]);
  const [graduationYearError, setGraduationYearError] = useState('');

  const playAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useFocusEffect(
    React.useCallback(() => {
      playAnimation();
      setLoading(true);
      const fetchProfile = async () => {
        if (!user?.uid) return;
        try {
          const response = await fetch(`${BACKEND_URL}/user_info/${user.uid}`);
          if (!response.ok) throw new Error('Failed to fetch user info');
          const data = await response.json();
          setProfileData(data);
          setCache(data);
        } catch (e) {
          if (cache) {
            setProfileData(cache);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, [user?.uid])
  );

  if (!profileData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Failed to load profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use profileData for all fields below
  const profileImage = profileData.profileImage;
  const gpa = profileData.gpa || '';
  const email = profileData.email || user?.email;

  const pickImage = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
        } else {
          // Assuming setProfileImage is called elsewhere in the component
        }
      }
    );
  };

  const handleMajorChange = (text) => {
    setNewMajor(text);
    if (text.length > 0) {
      const filtered = ucBerkeleyMajors.filter(major =>
        major.toLowerCase().includes(text.toLowerCase())
      );
      setMajorSuggestions(filtered);
    } else {
      setMajorSuggestions([]);
    }
  };

  const handleDepartmentChange = (text) => {
    setNewDepartment(text);
    if (text.length > 0) {
      const filtered = ucBerkeleyDepartments.filter(department =>
        department.toLowerCase().includes(text.toLowerCase())
      );
      setDepartmentSuggestions(filtered);
    } else {
      setDepartmentSuggestions([]);
    }
  };

  const selectMajor = (major) => {
    // Assuming setMajors is called elsewhere in the component
  };

  const selectDepartment = (department) => {
    // Assuming setDepartments is called elsewhere in the component
  };

  const removeMajor = (index) => {
    // Assuming setMajors is called elsewhere in the component
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      auth().signOut();
    } catch (e) {
      console.log('Sign-out error:', e);
    }
  };

  const InfoCard = ({ title, children }) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{title}</Text>
      {children}
    </View>
  );

  const validateGraduationYear = (value) => {
    if (value === '') {
      setGraduationYearError('');
      return;
    }

    const yearNum = parseInt(value);
    if (isNaN(yearNum) || yearNum < 2023 || yearNum > 3000) {
      setGraduationYearError('Please enter a valid year (2023-3000)');
    } else {
      setGraduationYearError('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={pickImage}
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {user?.displayName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.editOverlay}>
                  <Icon name="edit" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.email}>{email}</Text>
            </View>

            <View style={styles.infoSection}>
              <InfoCard title="Majors">
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={newMajor}
                    onChangeText={handleMajorChange}
                    placeholder="Add a major"
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => newMajor.trim() && selectMajor(newMajor.trim())}
                  >
                    <Icon name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                {majorSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {majorSuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={`major-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => selectMajor(item)}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.tagsContainer}>
                  {profileData.majors?.map((major, index) => (
                    <Tag 
                      key={index} 
                      text={major} 
                      onRemove={() => removeMajor(index)}
                    />
                  ))}
                </View>
              </InfoCard>

              <InfoCard title="Departments">
                <View style={styles.departmentsContainer}>
                  {profileData.departments?.map((department, index) => (
                    <View key={index} style={styles.departmentTag}>
                      <Text style={styles.departmentText}>{department}</Text>
                    </View>
                  ))}
                  {profileData.departments?.length === 0 && (
                    <Text style={styles.placeholderText}>
                      Select a major first
                    </Text>
                  )}
                </View>
              </InfoCard>

              <InfoCard title="GPA">
                <Text style={styles.infoValue}>{gpa || 'Not specified'}</Text>
              </InfoCard>

              <InfoCard title="Graduation Year">
                <View>
                  <TextInput
                    style={[
                      styles.graduationYearInput,
                      graduationYearError ? styles.inputError : null
                    ]}
                    value={profileData.graduationYear || ''}
                    onChangeText={validateGraduationYear}
                    placeholder="Enter year"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {graduationYearError ? (
                    <Text style={styles.errorText}>{graduationYearError}</Text>
                  ) : null}
                </View>
              </InfoCard>
            </View>

            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={signOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
          {loading && (
            <View style={{
              position: 'absolute', left: 0, top: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10
            }}>
              <Text>Loading profile...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoSection: {
    width: '100%',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  infoTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  removeTag: {
    padding: 2,
  },
  signOutButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 100,
    alignItems: 'center',
    width: '100%',
    maxWidth: 180,
    marginVertical: 20,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  graduationYearInput: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    maxHeight: 150,
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#111827',
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  departmentTag: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  departmentText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
});