import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomButton from '../../components/CustomButton';
import { Colors, Gradients } from '../../constants/colors';
import { API_CONFIG } from '../../config/api';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleOtpChange = (value, index) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = `otp${index + 1}`;
        // Focus next input (you'd need refs for this in a real implementation)
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OTP_VERIFY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpString,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'OTP verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OTP_SEND}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          purpose: 'verification',
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'OTP sent successfully!');
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        Alert.alert('Error', result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResendLoading(false);
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
                name="shield-check"
                size={80}
                color={Colors.white}
              />
              <Text style={styles.logoText}>Verify Your Email</Text>
              <Text style={styles.tagline}>
                We've sent a verification code to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to your email
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    selectionColor={Colors.primary}
                  />
                ))}
              </View>

              <CustomButton
                title="Verify OTP"
                onPress={handleVerifyOTP}
                loading={loading}
                style={styles.verifyButton}
                gradient
                disabled={otp.join('').length !== 6}
              />

              <View style={styles.resendContainer}>
                {!canResend ? (
                  <Text style={styles.countdownText}>
                    Resend code in {countdown} seconds
                  </Text>
                ) : (
                  <CustomButton
                    title="Resend OTP"
                    onPress={handleResendOTP}
                    loading={resendLoading}
                    variant="text"
                    style={styles.resendButton}
                  />
                )}
              </View>

              <View style={styles.backContainer}>
                <Text style={styles.backText}>Wrong email? </Text>
                <CustomButton
                  title="Go Back"
                  onPress={() => navigation.goBack()}
                  variant="text"
                  style={styles.backButton}
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
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: 'bold',
    opacity: 1,
  },
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: 30,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  verifyButton: {
    marginBottom: 20,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.gray,
  },
  resendButton: {
    paddingHorizontal: 0,
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: Colors.gray,
  },
  backButton: {
    paddingHorizontal: 0,
  },
});

export default OTPVerificationScreen;