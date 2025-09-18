import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomPicker from './src/components/CustomPicker';

const TestPickerScreen = () => {
  const [selectedValue, setSelectedValue] = useState('');

  const items = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
    { label: 'Option 4', value: 'option4' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Picker Test</Text>
      <CustomPicker
        label="Select an option"
        value={selectedValue}
        onValueChange={setSelectedValue}
        items={items}
        placeholder="Choose an option..."
      />
      <Text style={styles.selectedText}>
        Selected: {selectedValue || 'None'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  selectedText: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
});

export default TestPickerScreen;