import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomPicker from '../../components/CustomPicker';
import { Colors, Gradients } from '../../constants/colors';
import { createAthlete } from '../../services/FirebaseService';

const AthleteRegistrationScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    state: '',
    district: '',
    address: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    sportsBackground: '',
    medicalHistory: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Options for dropdowns
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];

  const stateOptions = [
    { label: 'Andhra Pradesh', value: 'andhra-pradesh' },
    { label: 'Assam', value: 'assam' },
    { label: 'Bihar', value: 'bihar' },
    { label: 'Chhattisgarh', value: 'chhattisgarh' },
    { label: 'Delhi', value: 'delhi' },
    { label: 'Gujarat', value: 'gujarat' },
    { label: 'Haryana', value: 'haryana' },
    { label: 'Himachal Pradesh', value: 'himachal-pradesh' },
    { label: 'Karnataka', value: 'karnataka' },
    { label: 'Kerala', value: 'kerala' },
    { label: 'Madhya Pradesh', value: 'madhya-pradesh' },
    { label: 'Maharashtra', value: 'maharashtra' },
    { label: 'Odisha', value: 'odisha' },
    { label: 'Punjab', value: 'punjab' },
    { label: 'Rajasthan', value: 'rajasthan' },
    { label: 'Tamil Nadu', value: 'tamil-nadu' },
    { label: 'Telangana', value: 'telangana' },
    { label: 'Uttar Pradesh', value: 'uttar-pradesh' },
    { label: 'West Bengal', value: 'west-bengal' }
  ];

  const relationshipOptions = [
    { label: 'Parent', value: 'parent' },
    { label: 'Guardian', value: 'guardian' },
    { label: 'Sibling', value: 'sibling' },
    { label: 'Spouse', value: 'spouse' },
    { label: 'Friend', value: 'friend' },
    { label: 'Other', value: 'other' }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 8 || parseInt(formData.age) > 35) {
      newErrors.age = 'Age must be between 8 and 35 years';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }

    if (!formData.emergencyContact.name.trim()) {
      newErrors['emergencyContact.name'] = 'Emergency contact name is required';
    }

    if (!formData.emergencyContact.phone.trim()) {
      newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
    }

    if (!formData.emergencyContact.relationship) {
      newErrors['emergencyContact.relationship'] = 'Relationship is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Calculate age and age group
      const ageNum = parseInt(formData.age);
      let ageGroup = 'Senior';
      if (ageNum <= 12) {
        ageGroup = 'Under-12';
      } else if (ageNum <= 15) {
        ageGroup = 'Under-15';
      } else if (ageNum <= 18) {
        ageGroup = 'Under-18';
      }

      // Prepare athlete data for Firestore (optimized)
      const athleteData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: ageNum,
        gender: formData.gender,
        // Only include height/weight if they have values
        ...(formData.height && { height: parseFloat(formData.height) }),
        ...(formData.weight && { weight: parseFloat(formData.weight) }),
        state: formData.state,
        district: formData.district,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyContact.name,
          phone: formData.emergencyContact.phone,
          relationship: formData.emergencyContact.relationship
        },
        // Only include optional fields if they have values
        ...(formData.sportsBackground && { sportsBackground: formData.sportsBackground }),
        ...(formData.medicalHistory && { medicalHistory: formData.medicalHistory }),
        ageGroup,
        sport: 'General',
        bestScores: {},
        createdAt: new Date().toISOString(), // Use ISO string instead of Date object
        updatedAt: new Date().toISOString()
      };

      // Add athlete to Firestore
      const result = await createAthlete(athleteData);
      
      if (result.success) {
        // Show green success popup
        Alert.alert(
          'Success',
          'Athlete registered successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  age: '',
                  gender: '',
                  height: '',
                  weight: '',
                  state: '',
                  district: '',
                  address: '',
                  emergencyContact: {
                    name: '',
                    phone: '',
                    relationship: ''
                  },
                  sportsBackground: '',
                  medicalHistory: ''
                });
                setErrors({});
                
                // Navigate back or to assessment submission with the new athlete
                navigation.navigate('AssessmentSubmission', { 
                  newAthleteId: result.id, 
                  newAthleteName: athleteData.name 
                });
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to register athlete');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to register athlete. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <MaterialCommunityIcons name="account-plus" size={32} color={Colors.white} />
            <Text style={styles.headerTitle}>Register Athlete</Text>
            <Text style={styles.headerSubtitle}>Add new athlete to the system</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <CustomInput
                label="Full Name *"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter full name"
                leftIcon="account"
                error={errors.name}
                autoCapitalize="words"
              />

              <CustomInput
                label="Email Address *"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter email address"
                leftIcon="email"
                keyboardType="email-address"
                error={errors.email}
                autoCapitalize="none"
              />

              <CustomInput
                label="Phone Number *"
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter phone number"
                leftIcon="phone"
                keyboardType="phone-pad"
                error={errors.phone}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <CustomInput
                    label="Age *"
                    value={formData.age}
                    onChangeText={(value) => handleInputChange('age', value)}
                    placeholder="Age"
                    leftIcon="calendar"
                    keyboardType="numeric"
                    error={errors.age}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <CustomPicker
                    label="Gender *"
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    items={genderOptions}
                    placeholder="Select gender"
                    error={errors.gender}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <CustomInput
                    label="Height (cm)"
                    value={formData.height}
                    onChangeText={(value) => handleInputChange('height', value)}
                    placeholder="Height"
                    leftIcon="human-male-height"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <CustomInput
                    label="Weight (kg)"
                    value={formData.weight}
                    onChangeText={(value) => handleInputChange('weight', value)}
                    placeholder="Weight"
                    leftIcon="weight-kilogram"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location Details</Text>
              
              <CustomPicker
                label="State *"
                value={formData.state}
                onValueChange={(value) => handleInputChange('state', value)}
                items={stateOptions}
                placeholder="Select state"
                error={errors.state}
              />

              <CustomInput
                label="District *"
                value={formData.district}
                onChangeText={(value) => handleInputChange('district', value)}
                placeholder="Enter district"
                leftIcon="map-marker"
                error={errors.district}
                autoCapitalize="words"
              />

              <CustomInput
                label="Address"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Enter full address"
                leftIcon="home"
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              
              <CustomInput
                label="Contact Name *"
                value={formData.emergencyContact.name}
                onChangeText={(value) => handleInputChange('emergencyContact.name', value)}
                placeholder="Emergency contact name"
                leftIcon="account-heart"
                error={errors['emergencyContact.name']}
                autoCapitalize="words"
              />

              <CustomInput
                label="Contact Phone *"
                value={formData.emergencyContact.phone}
                onChangeText={(value) => handleInputChange('emergencyContact.phone', value)}
                placeholder="Emergency contact phone"
                leftIcon="phone"
                keyboardType="phone-pad"
                error={errors['emergencyContact.phone']}
              />

              <CustomPicker
                label="Relationship *"
                value={formData.emergencyContact.relationship}
                onValueChange={(value) => handleInputChange('emergencyContact.relationship', value)}
                items={relationshipOptions}
                placeholder="Select relationship"
                error={errors['emergencyContact.relationship']}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              
              <CustomInput
                label="Sports Background"
                value={formData.sportsBackground}
                onChangeText={(value) => handleInputChange('sportsBackground', value)}
                placeholder="Describe sports background and experience"
                leftIcon="medal"
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />

              <CustomInput
                label="Medical History"
                value={formData.medicalHistory}
                onChangeText={(value) => handleInputChange('medicalHistory', value)}
                placeholder="Any relevant medical history or conditions"
                leftIcon="medical-bag"
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />
            </View>

            <CustomButton
              title="Register Athlete"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
              gradient
              leftIcon="account-plus"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default AthleteRegistrationScreen;