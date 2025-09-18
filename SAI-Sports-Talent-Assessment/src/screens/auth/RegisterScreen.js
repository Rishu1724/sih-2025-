import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { Colors, Gradients } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || formData.age < 10 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age (10-100)';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userData = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        phone: formData.phone.trim(),
      };

      const result = await register(
        formData.email.toLowerCase().trim(),
        formData.password,
        userData
      );

      Alert.alert(
        'Registration Successful!',
        result.message || 'Account created successfully! Please verify your email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={Gradients.primary} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons
                name="account-plus"
                size={60}
                color={Colors.white}
              />
              <Text style={styles.logoText}>Join SAI Sports</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Start your sports assessment journey
              </Text>

              <CustomInput
                label="Full Name"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter your full name"
                leftIcon="account-outline"
                error={errors.name}
              />

              <CustomInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="Enter your email"
                keyboardType="email-address"
                leftIcon="email-outline"
                error={errors.email}
                autoCapitalize="none"
              />

              <View style={styles.row}>
                <CustomInput
                  label="Age"
                  value={formData.age}
                  onChangeText={(value) => updateField('age', value)}
                  placeholder="Age"
                  keyboardType="numeric"
                  leftIcon="cake-variant"
                  error={errors.age}
                  style={styles.halfWidth}
                />

                <CustomInput
                  label="Phone"
                  value={formData.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  leftIcon="phone-outline"
                  error={errors.phone}
                  style={styles.halfWidth}
                />
              </View>

              <CustomInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                placeholder="Create password"
                secureTextEntry
                leftIcon="lock-outline"
                error={errors.password}
              />

              <CustomInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Confirm password"
                secureTextEntry
                leftIcon="lock-check-outline"
                error={errors.confirmPassword}
              />

              <CustomButton
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
                gradient
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <CustomButton
                  title="Sign In"
                  onPress={() => navigation.navigate('Login')}
                  variant="outline"
                  style={styles.loginButton}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  registerButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  loginButton: {
    paddingHorizontal: 30,
  },
});

export default RegisterScreen;