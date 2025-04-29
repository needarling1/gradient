import React from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';

export default function AcademicInfoScreen({ navigation, formData, updateFormData }) {
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Academic Information</Text>
      <TextInput
        placeholder="Major"
        style={styles.input}
        value={formData.major}
        onChangeText={(text) => handleChange('major', text)}
      />
      <TextInput
        placeholder="Department"
        style={styles.input}
        value={formData.department}
        onChangeText={(text) => handleChange('department', text)}
      />
      <TextInput
        placeholder="GPA"
        style={styles.input}
        keyboardType="decimal-pad"
        value={formData.gpa}
        onChangeText={(text) => handleChange('gpa', text)}
      />
      <TextInput
        placeholder="Graduation Year"
        style={styles.input}
        keyboardType="numeric"
        value={formData.graduationYear}
        onChangeText={(text) => handleChange('graduationYear', text)}
      />
      <Button title="Next" onPress={() => navigation.navigate('BcoursesToken')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
});
