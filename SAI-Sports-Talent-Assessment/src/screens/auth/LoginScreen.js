import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { Colors, Gradients } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { resetPassword } from '../../utils/authHelpers';
import { API_CONFIG } from '../../config/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, loginWithGoogle } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email.toLowerCase().trim(), password);
      // Navigation is handled by AuthContext/Firebase auth state change
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Navigation is handled by AuthContext/Firebase auth state change
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    try {
      const message = await resetPassword(email.toLowerCase().trim());
      Alert.alert('Success', message);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLoginWithOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OTP_SEND}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          purpose: 'login'
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'OTP Sent',
          'A verification code has been sent to your email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OTPVerification', { email: email.toLowerCase().trim() })
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setOtpLoading(false);
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
              <LinearGradient
                colors={['#FFC107', '#FF9800']}
                style={styles.logoCircle}
              >
                <MaterialCommunityIcons
                  name="medal"
                  size={60}
                  color={Colors.white}
                />
              </LinearGradient>
              <Text style={styles.logoText}>SAI Sports</Text>
              <Text style={styles.tagline}>Talent Assessment Platform</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>
                  Sign in to continue your sports journey
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <CustomInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  leftIcon="email-outline"
                  error={errors.email}
                  autoCapitalize="none"
                />

                <CustomInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  leftIcon="lock-outline"
                  error={errors.password}
                  rightIcon="eye"
                />
              </View>

              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <CustomButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
                gradient
              />

              <View style={styles.socialLoginContainer}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity 
                    style={styles.socialButton}
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    <MaterialCommunityIcons 
                      name="google" 
                      size={24} 
                      color="#DB4437" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialButton}>
                    <MaterialCommunityIcons 
                      name="facebook" 
                      size={24} 
                      color="#4267B2" 
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.socialButton}>
                    <MaterialCommunityIcons 
                      name="apple" 
                      size={24} 
                      color="#000000" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <CustomButton
                title="Login with OTP"
                onPress={handleLoginWithOTP}
                loading={otpLoading}
                variant="outline"
                style={styles.otpButton}
                leftIcon="email-outline"
              />

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupLink}>Sign Up</Text>
                </TouchableOpacity>
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
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 5,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 30,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 15,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 10,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 25,
    borderRadius: 16,
    paddingVertical: 16,
  },
  socialLoginContainer: {
    marginBottom: 25,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.lightGray,
  },
  dividerText: {
    marginHorizontal: 15,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 25,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpButton: {
    marginBottom: 25,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default LoginScreen;