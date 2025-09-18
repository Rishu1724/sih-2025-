import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';

const CustomCard = ({ 
  children, 
  title, 
  subtitle, 
  icon, 
  rightElement, 
  style,
  ...props
}) => {
  // Platform-specific shadow styles
  const shadowStyle = Platform.select({
    web: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    default: {
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  });

  return (
    <View style={[styles.card, shadowStyle, style]} {...props}>
      {(title || subtitle || icon || rightElement) && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <View style={styles.textContainer}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          </View>
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rightElement: {
    marginLeft: 12,
  },
});

export default CustomCard;