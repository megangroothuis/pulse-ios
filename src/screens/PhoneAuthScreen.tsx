import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSignUp, useSignIn } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { useAuthContext } from '../context/AuthContext';

type PhoneAuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC = () => {
  const navigation = useNavigation<PhoneAuthScreenNavigationProp>();
  const { refreshAuth } = useAuthContext();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn } = useSignIn();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format phone number to E.164 format (basic validation)
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // If it starts with 1 (US country code), keep it
    if (digits.startsWith('1') && digits.length === 11) {
      return `+${digits}`;
    }
    
    // Otherwise, assume US number and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If it already has +, return as is
    if (input.startsWith('+')) {
      return input;
    }
    
    return input;
  };

  const onSignUpPress = async () => {
    if (!signUpLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Create the user with phone number
      await signUp.create({
        phoneNumber: formattedPhone,
      });

      // Send verification code
      await signUp.preparePhoneNumberVerification({ strategy: 'phone_code' });
      
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to send verification code');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!signUpLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      // Verify the code
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        // Refresh auth context to sync with Supabase
        await refreshAuth();
        // Navigation will be handled by App.tsx based on auth state
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignInPress = async () => {
    if (!signInLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Create sign-in with phone number
      await signIn.create({
        identifier: formattedPhone,
      });

      // Send verification code
      await signIn.prepareFirstFactor({
        strategy: 'phone_code',
      });
      
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to send verification code');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onPressVerifySignIn = async () => {
    if (!signInLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      // Verify the code
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        await refreshAuth();
        // Navigation will be handled by App.tsx
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <IOSStatusBar />
      
      {/* Base gradient layer */}
      <LinearGradient
        colors={['#1E3A8A', '#312E81', '#4C1D95', '#6B21A8', '#7C3AED']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBase}
      />
      
      {/* Overlay gradient layer */}
      <LinearGradient
        colors={['rgba(139, 26, 139, 0.6)', 'rgba(160, 32, 240, 0.5)', 'rgba(220, 20, 60, 0.4)', 'rgba(233, 30, 99, 0.3)']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Pulse</Text>
              <Text style={styles.subtitle}>
                {pendingVerification
                  ? 'Enter the verification code sent to your phone'
                  : 'Sign in with your phone number to get started'}
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!pendingVerification ? (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={onSignUpPress}
                  disabled={isLoading || !phoneNumber.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={onSignInPress}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123456"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={pendingVerification && signIn ? onPressVerifySignIn : onPressVerify}
                  disabled={isLoading || !code.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => {
                    setPendingVerification(false);
                    setCode('');
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.linkText}>Change phone number</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    backgroundColor: '#C4B5FD',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.4)',
  },
  errorText: {
    color: '#FF6B9D',
    fontSize: 14,
    textAlign: 'center',
  },
});
