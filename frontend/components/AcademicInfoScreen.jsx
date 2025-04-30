import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ucBerkeleyMajors, majorToDepartmentMapping } from '../data/ucBerkeleyData';

const Tag = ({ text, onRemove }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{text}</Text>
    <TouchableOpacity onPress={onRemove} style={styles.removeTag}>
      <Ionicons name="close" size={14} color="#6B7280" />
    </TouchableOpacity>
  </View>
);

export default function AcademicInfoScreen({ navigation, formData, updateFormData }) {
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState({});
  const [newMajor, setNewMajor] = useState('');
  const [majorSuggestions, setMajorSuggestions] = useState([]);
  const [majors, setMajors] = useState(formData.majors || []);
  const [departments, setDepartments] = useState(formData.departments || []);
  const [gpa, setGpa] = useState(formData.gpa || '');
  const [graduationYear, setGraduationYear] = useState(formData.graduationYear || '');

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

  const selectMajor = (selectedMajor) => {
    if (!majors.includes(selectedMajor)) {
      const updatedMajors = [...majors, selectedMajor];
      setMajors(updatedMajors);
      
      // Update departments
      const dept = majorToDepartmentMapping[selectedMajor];
      if (dept && !departments.includes(dept)) {
        const updatedDepartments = [...departments, dept];
        setDepartments(updatedDepartments);
        updateFormData({
          majors: updatedMajors,
          departments: updatedDepartments,
        });
      }
    }
    setNewMajor('');
    setMajorSuggestions([]);
    setErrors(prev => ({ ...prev, major: null }));
  };

  const removeMajor = (index) => {
    const updatedMajors = majors.filter((_, i) => i !== index);
    setMajors(updatedMajors);
    
    // Recalculate departments based on remaining majors
    const updatedDepartments = [...new Set(
      updatedMajors.map(major => majorToDepartmentMapping[major]).filter(Boolean)
    )];
    setDepartments(updatedDepartments);
    updateFormData({
      majors: updatedMajors,
      departments: updatedDepartments,
    });
  };

  const validateGpa = (value) => {
    // Only allow numbers and one decimal point
    if (value === '') {
      setGpa(value);
      setErrors(prev => ({ ...prev, gpa: null }));
      return;
    }

    // Allow only one decimal point and numbers
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    const gpaNum = parseFloat(value);
    if (value.length > 0 && (!gpaNum || gpaNum < 0 || gpaNum > 4.0)) {
      setErrors(prev => ({ ...prev, gpa: 'Please enter a valid GPA (0.0-4.0)' }));
    } else {
      // Limit to one decimal place
      const formattedValue = value.includes('.') ? 
        value.match(/^\d*\.?\d{0,1}/)[0] : value;
      setGpa(formattedValue);
      setErrors(prev => ({ ...prev, gpa: null }));
      updateFormData({
        majors,
        departments,
        gpa: formattedValue,
        graduationYear
      });
    }
  };

  const validateGraduationYear = (value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    if (value === '') {
      setGraduationYear(value);
      setErrors(prev => ({ ...prev, graduationYear: null }));
      return;
    }

    const yearNum = parseInt(value);
    if (value.length === 4) {
      if (yearNum < 2023 || yearNum > 3000) {
        setErrors(prev => ({ ...prev, graduationYear: 'Please enter a valid year (2023-3000)' }));
      } else {
        setErrors(prev => ({ ...prev, graduationYear: null }));
      }
    }
    setGraduationYear(value);
    updateFormData({
      majors,
      departments,
      gpa,
      graduationYear: value
    });
  };

  const validate = () => {
    const newErrors = {};
    if (majors.length === 0) {
      newErrors.major = 'Please select at least one major';
    }
    if (!gpa) {
      newErrors.gpa = 'Please enter your GPA';
    } else if (isNaN(parseFloat(gpa)) || parseFloat(gpa) < 0 || parseFloat(gpa) > 4.0) {
      newErrors.gpa = 'Please enter a valid GPA (0.0-4.0)';
    }
    if (!graduationYear) {
      newErrors.graduationYear = 'Please enter your graduation year';
    } else {
      const yearNum = parseInt(graduationYear);
      if (isNaN(yearNum) || yearNum < 2023 || yearNum > 3000) {
        newErrors.graduationYear = 'Please enter a valid year (2023-3000)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add useEffect to validate on mount and state changes
  useEffect(() => {
    validate();
  }, [majors, gpa, graduationYear]);

  const handleNext = () => {
    if (validate()) {
      updateFormData({
        majors,
        departments,
        gpa,
        graduationYear
      });
      navigation.navigate('BcoursesToken');
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 3</Text>
        </View>
      </View>

      <Text style={styles.title}>Academic Information</Text>

      <View style={styles.inputContainer}>
        <View style={styles.section}>
          <Text style={styles.label}>Major(s)</Text>
          <View style={[styles.input, errors.major && styles.inputError]}>
            <TextInput
              placeholder="Search for your major"
              style={styles.textInput}
              value={newMajor}
              onChangeText={handleMajorChange}
              placeholderTextColor="#A1A1A1"
            />
          </View>
          {majorSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={majorSuggestions}
                keyExtractor={(item, index) => `major-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => selectMajor(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                )}
                nestedScrollEnabled
                style={styles.suggestionsList}
              />
            </View>
          )}
          <View style={styles.tagsContainer}>
            {majors.map((major, index) => (
              <Tag 
                key={index} 
                text={major} 
                onRemove={() => removeMajor(index)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Department(s)</Text>
          <View style={styles.tagsContainer}>
            {departments.length > 0 ? (
              departments.map((department, index) => (
                <Tag 
                  key={index} 
                  text={department}
                  onRemove={null}  // No remove function as departments are auto-managed
                />
              ))
            ) : (
              <Text style={styles.placeholderText}>Automatically added based on majors</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>GPA</Text>
          <TextInput
            placeholder="0.0 - 4.0"
            style={[styles.input, errors.gpa && styles.inputError]}
            value={gpa}
            onChangeText={validateGpa}
            keyboardType="decimal-pad"
            maxLength={3}
            placeholderTextColor="#A1A1A1"
          />
          {errors.gpa && <Text style={styles.errorText}>{errors.gpa}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Graduation Year</Text>
          <TextInput
            placeholder="2023 - 3000"
            style={[styles.input, errors.graduationYear && styles.inputError]}
            value={graduationYear}
            onChangeText={validateGraduationYear}
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor="#A1A1A1"
          />
          {errors.graduationYear && <Text style={styles.errorText}>{errors.graduationYear}</Text>}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (Object.keys(errors).length > 0 || majors.length === 0) && styles.buttonDisabled
        ]}
        onPress={handleNext}
        disabled={Object.keys(errors).length > 0 || majors.length === 0}
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
  backButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 8,
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
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  inputContainer: {
    gap: 16,
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
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 17,
    color: '#000000',
    height: '100%',
    flex: 1,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  suggestionsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
  },
  suggestionsList: {
    borderRadius: 12,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000000',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#000000',
    marginRight: 4,
  },
  removeTag: {
    padding: 2,
  },
  placeholderText: {
    fontSize: 15,
    color: '#A1A1A1',
    fontStyle: 'italic',
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
