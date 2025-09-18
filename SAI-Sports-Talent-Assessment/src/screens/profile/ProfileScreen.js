import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomCard from '../../components/CustomCard';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getAthletes } from '../../services/FirebaseService';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [athleteData, setAthleteData] = React.useState(null);
  const [loadingAthleteData, setLoadingAthleteData] = React.useState(false);
  const [editData, setEditData] = React.useState({
    name: '',
    age: '',
    phone: '',
  });

  useEffect(() => {
    // Initialize editData with user data
    setEditData({
      name: user?.name || '',
      age: user?.age?.toString() || '',
      phone: user?.phone || '',
    });
    
    // Fetch athlete data
    fetchAthleteData();
  }, [user?.email]);

  const fetchAthleteData = async () => {
    if (!user?.email) return;
    
    setLoadingAthleteData(true);
    try {
      // Try to find an athlete with the same email as the user
      const athletes = await getAthletes();
      const matchingAthlete = athletes.find(athlete => athlete.email === user.email);
      
      if (matchingAthlete) {
        setAthleteData(matchingAthlete);
        // Update editData with athlete information
        setEditData(prev => ({
          ...prev,
          age: matchingAthlete.age?.toString() || prev.age,
          phone: matchingAthlete.phone || prev.phone,
        }));
      }
    } catch (error) {
      console.error('Error fetching athlete data:', error);
    } finally {
      setLoadingAthleteData(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateUser({
        name: editData.name,
        age: editData.age ? parseInt(editData.age) : null,
        phone: editData.phone,
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleProfilePictureChange = () => {
    Alert.alert('Info', 'Profile picture functionality is currently disabled');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled by AuthContext state change
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  // Determine which data to display (athlete data takes precedence)
  const displayName = editData.name || user?.name || 'Not set';
  const displayAge = editData.age || athleteData?.age || user?.age || 'Not set';
  const displayPhone = editData.phone || athleteData?.phone || user?.phone || 'Not set';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <CustomCard style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {user?.photoURL ? (
                <Image 
                  source={{ uri: user.photoURL }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <MaterialCommunityIcons
                    name="account"
                    size={60}
                    color={Colors.white}
                  />
                </View>
              )}
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.joinDate}>
              Member since {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </CustomCard>

        {/* Profile Information */}
        <CustomCard style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            <CustomButton
              title={isEditing ? 'Cancel' : 'Edit'}
              onPress={() => {
                if (isEditing) {
                  // Reset to original values
                  setEditData({
                    name: user?.name || '',
                    age: athleteData?.age?.toString() || user?.age?.toString() || '',
                    phone: athleteData?.phone || user?.phone || '',
                  });
                }
                setIsEditing(!isEditing);
              }}
              variant="outline"
              style={styles.editButton}
            />
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <CustomInput
                label="Full Name"
                value={editData.name}
                onChangeText={(value) => setEditData(prev => ({ ...prev, name: value }))}
                placeholder="Enter your name"
                leftIcon="account-outline"
              />
              <CustomInput
                label="Age"
                value={editData.age}
                onChangeText={(value) => setEditData(prev => ({ ...prev, age: value }))}
                placeholder="Enter your age"
                keyboardType="numeric"
                leftIcon="cake-variant"
              />
              <CustomInput
                label="Phone"
                value={editData.phone}
                onChangeText={(value) => setEditData(prev => ({ ...prev, phone: value }))}
                placeholder="Enter your phone"
                keyboardType="phone-pad"
                leftIcon="phone-outline"
              />
              <CustomButton
                title="Save Changes"
                onPress={handleSave}
                style={styles.saveButton}
                gradient
              />
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="account-outline" size={18} color={Colors.gray} />
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{displayName}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="cake-variant" size={18} color={Colors.gray} />
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{displayAge}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="phone-outline" size={18} color={Colors.gray} />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{displayPhone}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="email-outline" size={18} color={Colors.gray} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'Not set'}</Text>
              </View>
            </View>
          )}
        </CustomCard>

        {/* App Settings */}
        <CustomCard style={styles.settingsCard}>
          <Text style={styles.cardTitle}>App Settings</Text>
          
          <CustomButton
            title="Privacy Policy"
            onPress={() => Alert.alert('Info', 'Privacy policy feature coming soon')}
            variant="outline"
            style={styles.settingButton}
          />
          
          <CustomButton
            title="Terms of Service"
            onPress={() => Alert.alert('Info', 'Terms of service feature coming soon')}
            variant="outline"
            style={styles.settingButton}
          />
          
          <CustomButton
            title="Help & Support"
            onPress={() => Alert.alert('Info', 'Help & support feature coming soon')}
            variant="outline"
            style={styles.settingButton}
          />
        </CustomCard>

        {/* Logout */}
        <CustomCard style={styles.logoutCard}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            variant="danger"
            style={styles.logoutButton}
          />
        </CustomCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    // Fixed deprecated shadow props
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // Fixed deprecated shadow props
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    // Fixed deprecated shadow props
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  joinDate: {
    fontSize: 14,
    color: Colors.gray,
  },
  infoCard: {
    marginBottom: 20,
    padding: 20,
    // Fixed deprecated shadow props
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  editButton: {
    paddingHorizontal: 20,
  },
  editForm: {
    marginTop: 10,
  },
  saveButton: {
    marginTop: 10,
  },
  infoList: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  settingsCard: {
    marginBottom: 20,
    padding: 20,
    // Fixed deprecated shadow props
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingButton: {
    marginBottom: 10,
  },
  logoutCard: {
    marginBottom: 20,
    alignItems: 'center',
    padding: 20,
    // Fixed deprecated shadow props
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButton: {
    width: '100%',
  },
});

export default ProfileScreen;