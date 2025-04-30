import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ucBerkeleyMajors, majorToDepartmentMapping } from '../../data/ucBerkeleyData';

const Tag = ({ text, onRemove }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{text}</Text>
    {onRemove && (
      <TouchableOpacity onPress={onRemove} style={styles.removeTag}>
        <Ionicons name="close" size={14} color="#6B7280" />
      </TouchableOpacity>
    )}
  </View>
);

export default function AcademicInfoScreen({ navigation, formData, updateFormData }) {
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState({});
  const [newMajor, setNewMajor] = useState('');
  const [majorSuggestions, setMajorSuggestions] = useState([]);
  const [majors, setMajors] = useState(formData.majors || []);
  const [departments, setDepartments] = useState(formData.departments || []);
  const [graduationYear, setGraduationYear] = useState(formData.graduationYear || '');
  const [gpa, setGpa] = useState(formData.gpa || '');

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

  const selectMajor = (major) => {
    if (!majors.includes(major)) {
      const updatedMajors = [...majors, major];
      setMajors(updatedMajors);
      
      // Update departments
      const newDepartments = new Set(departments);
      updatedMajors.forEach(m => {
        const depts = majorToDepartmentMapping[m] || [];
        depts.forEach(dept => newDepartments.add(dept));
      });
      setDepartments([...newDepartments]);
      
      // Update form data
      updateFormData({ 
        majors: updatedMajors,
        departments: [...newDepartments]
      });
    }
    setNewMajor('');
    setMajorSuggestions([]);
  };

  const removeMajor = (index) => {
    const majorToRemove = majors[index];
    const updatedMajors = majors.filter((_, i) => i !== index);
    setMajors(updatedMajors);

    // Recalculate departments
    const remainingDepartments = new Set();
    updatedMajors.forEach(major => {
      const depts = majorToDepartmentMapping[major] || [];
      depts.forEach(dept => remainingDepartments.add(dept));
    });

    setDepartments([...remainingDepartments]);
    updateFormData({ 
      majors: updatedMajors,
      departments: [...remainingDepartments]
    });
  };

  const validateGraduationYear = (value) => {
    setGraduationYear(value);
    const yearNum = parseInt(value);
    if (value && (isNaN(yearNum) || yearNum < 2023 || yearNum > 3000)) {
      setErrors(prev => ({ ...prev, graduationYear: 'Please enter a valid year (2023-3000)' }));
    } else {
      setErrors(prev => ({ ...prev, graduationYear: null }));
    }
    updateFormData({ graduationYear: value });
  };

  const validateGpa = (value) => {
    setGpa(value);
    const gpaNum = parseFloat(value);
    if (value && (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4)) {
      setErrors(prev => ({ ...prev, gpa: 'Please enter a valid GPA (0-4.0)' }));
    } else {
      setErrors(prev => ({ ...prev, gpa: null }));
    }
    updateFormData({ gpa: value });
  };

  const validate = () => {
    const newErrors = {};
    if (majors.length === 0) {
      newErrors.majors = 'Please select at least one major';
    }
    if (graduationYear) {
      const yearNum = parseInt(graduationYear);
      if (isNaN(yearNum) || yearNum < 2023 || yearNum > 3000) {
        newErrors.graduationYear = 'Please enter a valid year (2023-3000)';
      }
    }
    if (gpa) {
      const gpaNum = parseFloat(gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
        newErrors.gpa = 'Please enter a valid GPA (0-4.0)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      navigation.navigate('BcoursesToken');
    }
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
            <View style={[styles.progress, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 3</Text>
        </View>
      </View>

      <Text style={styles.title}>Academic Information</Text>
      <Text style={styles.subtitle}>Tell us about your academic journey</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Majors</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMajor}
            onChangeText={handleMajorChange}
            placeholder="Search for your major"
            placeholderTextColor="#9CA3AF"
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
        {errors.majors && (
          <Text style={styles.errorText}>{errors.majors}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Departments</Text>
        <Text style={styles.sectionSubtitle}>Automatically added based on your majors</Text>
        <View style={styles.tagsContainer}>
          {departments.length > 0 ? (
            departments.map((department, index) => (
              <Tag 
                key={index} 
                text={department}
              />
            ))
          ) : (
            <Text style={styles.placeholderText}>Select a major first</Text>
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>GPA (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              errors.gpa && styles.inputError
            ]}
            value={gpa}
            onChangeText={validateGpa}
            placeholder="0.00"
            keyboardType="decimal-pad"
            maxLength={4}
            placeholderTextColor="#9CA3AF"
          />
          {errors.gpa && (
            <Text style={styles.errorText}>{errors.gpa}</Text>
          )}
        </View>

        <View style={[styles.inputContainer, styles.halfWidth]}>
          <Text style={styles.label}>Graduation Year (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              errors.graduationYear && styles.inputError
            ]}
            value={graduationYear}
            onChangeText={validateGraduationYear}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor="#9CA3AF"
          />
          {errors.graduationYear && (
            <Text style={styles.errorText}>{errors.graduationYear}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleNext}
      >
        <Text style={styles.buttonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    height: 36,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  suggestionsContainer: {
    maxHeight: 120,
    marginBottom: 8,
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
  suggestionsList: {
    borderRadius: 8,
  },
  suggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 12,
    color: '#111827',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
    marginRight: 2,
  },
  removeTag: {
    padding: 2,
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 10,
    marginTop: 2,
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 'auto',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
}); 