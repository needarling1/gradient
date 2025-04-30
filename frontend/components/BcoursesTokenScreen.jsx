import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BcoursesTokenScreen({ navigation, formData, updateFormData }) {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  
  const validateToken = (token) => {
    // Pattern: 4 digits + tilde + 63 characters
    const tokenPattern = /^\d{4}~[A-Za-z0-9]{63}$/;
    return tokenPattern.test(token);
  };

  const handleChange = (text) => {
    updateFormData({ bcourseToken: text });
    if (text.length > 0) {
      setError(validateToken(text) ? '' : 'Invalid token format');
    } else {
      setError('');
    }
  };

  const handleContinue = () => {
    if (!formData.bcourseToken) {
      setError('Please enter your bCourses token');
      return;
    }
    if (!validateToken(formData.bcourseToken)) {
      setError('Invalid token format');
      return;
    }
    navigation.navigate('Review');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 3</Text>
        </View>
      </View>

      <Text style={styles.title}>BCourses Access Token</Text>
      <Text style={styles.subtitle}>Enter your bCourses access token to connect your account</Text>

      <View style={styles.inputContainer}>
        <View style={[
          styles.inputWrapper,
          error ? styles.inputError : null
        ]}>
          <Ionicons 
            name="key-outline" 
            size={20} 
            color={error ? "#EF4444" : "#3B82F6"} 
            style={styles.inputIcon} 
          />
          <TextInput
            placeholder="Paste your access token here"
            style={[styles.input, error && styles.inputTextError]}
            value={formData.bcourseToken}
            onChangeText={handleChange}
            secureTextEntry
            placeholderTextColor={error ? "#FCA5A5" : "#9CA3AF"}
          />
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            (error || !formData.bcourseToken) && styles.buttonDisabled
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  progress: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputTextError: {
    color: '#B91C1C',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingHorizontal: 4,
    paddingBottom: 34,
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
