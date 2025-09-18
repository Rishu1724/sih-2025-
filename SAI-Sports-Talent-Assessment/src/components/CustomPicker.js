import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const CustomPicker = ({ 
  label, 
  value, 
  onValueChange, 
  items = [], 
  placeholder, 
  error, 
  loading = false,
  style 
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const selectedItem = items.find(item => item.value === value);

  const handleSelect = (itemValue) => {
    onValueChange(itemValue);
    setShowOptions(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.picker,
          error && styles.pickerError,
          loading && styles.pickerLoading
        ]}
        onPress={() => {
          if (!loading && items.length > 0) {
            setShowOptions(true);
          }
        }}
        disabled={loading}
      >
        <Text style={[
          styles.pickerText,
          !value && styles.placeholderText
        ]}>
          {loading ? 'Loading...' : (selectedItem?.label || placeholder || 'Select an option')}
        </Text>
        <MaterialCommunityIcons 
          name="chevron-down" 
          size={18} 
          color={Colors.gray} 
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {/* Modal for displaying options */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setShowOptions(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
              <TouchableOpacity 
                onPress={() => setShowOptions(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.optionItem,
                    value === item.value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[
                    styles.optionText,
                    value === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <MaterialCommunityIcons 
                      name="check" 
                      size={18} 
                      color={Colors.primary} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 50,
  },
  pickerError: {
    borderColor: Colors.error,
  },
  pickerLoading: {
    opacity: 0.6,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.gray,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedOption: {
    backgroundColor: Colors.lightGray,
  },
  selectedOptionText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default CustomPicker;