import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';

export default function ReviewAndSubmitScreen({ formData, onComplete }) {
  const handleSubmit = () => {
    console.log('Final Submission:', formData);
    if (onComplete) onComplete(formData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Review Your Information</Text>
      {formData.profileImage && (
        <Image source={{ uri: formData.profileImage }} style={styles.avatar} />
      )}
      <Text style={styles.text}>Name: {formData.firstName} {formData.lastName}</Text>
      <Text style={styles.text}>Major: {formData.major}</Text>
      <Text style={styles.text}>Department: {formData.department}</Text>
      <Text style={styles.text}>GPA: {formData.gpa}</Text>
      <Text style={styles.text}>Graduation Year: {formData.graduationYear}</Text>
      <Text style={styles.text}>BCourses Token: {formData.bcourseToken}</Text>
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
});
