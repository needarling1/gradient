import React from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';

export default function BcoursesTokenScreen({ navigation, formData, updateFormData }) {
  const handleChange = (text) => {
    updateFormData({ bcourseToken: text });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BCourses Access Token</Text>
      <TextInput
        placeholder="Paste your access token here"
        style={styles.input}
        value={formData.bcourseToken}
        onChangeText={handleChange}
      />
      <Button title="Next" onPress={() => navigation.navigate('Review')} />
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
