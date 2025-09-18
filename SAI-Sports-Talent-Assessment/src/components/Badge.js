import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const Badge = ({ 
  title, 
  description, 
  icon, 
  earned = false, 
  dateEarned, 
  locked = false,
  style,
  ...props
}) => {
  // Platform-specific shadow styles
  const shadowStyle = Platform.select({
    web: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    default: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
  });

  return (
    <View style={[styles.container, shadowStyle, style]} {...props}>
      <View style={[styles.badge, locked && styles.lockedIconContainer]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={32} 
          color={locked ? Colors.gray : Colors.primary} 
        />
        {earned && (
          <View style={styles.earnedIndicator}>
            <MaterialCommunityIcons 
              name="check" 
              size={12} 
              color={Colors.success} 
            />
          </View>
        )}
      </View>
      <Text style={[styles.title, locked && styles.lockedText]}>
        {title}
      </Text>
      <Text style={[styles.description, locked && styles.lockedText]}>
        {description}
      </Text>
      {earned && dateEarned && (
        <Text style={styles.dateEarned}>
          Earned: {dateEarned}
        </Text>
      )}
      {locked && (
        <Text style={styles.lockedText}>
          Locked
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  lockedIconContainer: {
    opacity: 0.5,
  },
  title: {
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedText: {
    color: Colors.gray,
    opacity: 0.6,
  },
  dateEarned: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '500',
    textAlign: 'center',
  },
  earnedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: Colors.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Badge;