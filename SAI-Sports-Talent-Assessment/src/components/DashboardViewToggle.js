import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const DashboardViewToggle = ({ currentView, onViewChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard View</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'personal' && styles.activeButton
          ]}
          onPress={() => onViewChange('personal')}
        >
          <MaterialCommunityIcons 
            name={currentView === 'personal' ? 'account' : 'account-outline'} 
            size={20} 
            color={currentView === 'personal' ? Colors.white : Colors.primary}
          />
          <Text style={[
            styles.toggleText,
            currentView === 'personal' && styles.activeText
          ]}>
            Personal
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === 'global' && styles.activeButton
          ]}
          onPress={() => onViewChange('global')}
        >
          <MaterialCommunityIcons 
            name={currentView === 'global' ? 'earth' : 'web'} 
            size={20} 
            color={currentView === 'global' ? Colors.white : Colors.primary}
          />
          <Text style={[
            styles.toggleText,
            currentView === 'global' && styles.activeText
          ]}>
            Global
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  activeText: {
    color: Colors.white,
  },
});

export default DashboardViewToggle;