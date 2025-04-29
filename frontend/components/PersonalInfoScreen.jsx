import React from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';

export default function PersonalInfoScreen({ navigation, formData, updateFormData }) {
  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Personal Information</Text>
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={formData.firstName}
        onChangeText={(text) => handleChange('firstName', text)}
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={formData.lastName}
        onChangeText={(text) => handleChange('lastName', text)}
      />
      <Button title="Next" onPress={() => navigation.navigate('AcademicInfo')} />
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
