import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const ProgressBar = ({ 
  progress = 0, 
  total = 100, 
  color = Colors.primary,
  backgroundColor = Colors.lightGray,
  height = 8,
  showPercentage = false,
  style,
  label,
  icon,
}) => {
  const percentage = Math.min((progress / total) * 100, 100);

  return (
    <View style={[styles.container, style]}>
      {(label || icon) && (
        <View style={styles.labelContainer}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={16}
              color={Colors.textSecondary}
              style={styles.icon}
            />
          )}
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.progressContainer, { height, backgroundColor }]}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentage}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  percentage: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
    height: '100%',
  },
});

export default ProgressBar;