import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const BlockchainExplorer = ({ blockchainHash, transactionId, onVerify }) => {
  if (!blockchainHash || !transactionId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="blockchain" size={24} color={Colors.primary} />
        <Text style={styles.title}>Blockchain Verification</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Hash:</Text>
          <Text style={styles.value} selectable>{blockchainHash}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Transaction ID:</Text>
          <Text style={styles.value} selectable>{transactionId}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
          <Text style={styles.statusText}>Verified on Blockchain</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.verifyButton} onPress={onVerify}>
        <MaterialCommunityIcons name="eye" size={16} color={Colors.white} />
        <Text style={styles.verifyButtonText}>View on Blockchain Explorer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    color: Colors.text,
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BlockchainExplorer;