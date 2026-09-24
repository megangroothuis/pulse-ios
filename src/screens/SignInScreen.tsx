import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSupabase } from '../lib/supabase';

// Sign in with Apple is iOS-only and needs a native build that includes
// expo-apple-authentication, so it is loaded lazily.
async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const Apple = await import('expo-apple-authentication');
    return await Apple.isAvailableAsync();
  } catch {
    return false;
  }
}

async function signInWithApple() {
  const Apple = await import('expo-apple-authentication');
  const credential = await Apple.signInAsync({
    requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL],
  });
  if (!credential.identityToken) throw new Error('Apple did not return an identity token');
  const { error } = await getSupabase().auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  // Apple only shares the name on first sign-in; keep it for the profile.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  if (name) await getSupabase().auth.updateUser({ data: { full_name: name } });
}

export const SignInScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApple, setShowApple] = useState(false);

  useEffect(() => {
    appleAvailable().then(setShowApple);
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setStep('code');
    });

  const verifyCode = () =>
    run(async () => {
      const { error } = await getSupabase().auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (error) throw error;
      // LiveContext picks up the new session via onAuthStateChange.
    });

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const codeValid = /^\d{6,10}$/.test(code.trim());

  return (
    <LinearGradient colors={['#1E3A8A', '#4C1D95', '#7C3AED']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
          <View style={styles.brand}>
            <MaterialCommunityIcons name="music-note" size={40} color="#FFFFFF" />
            <Text style={styles.title}>Pulse</Text>
            <Text style={styles.subtitle}>See how your music moves you</Text>
          </View>

          {step === 'email' ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                onSubmitEditing={emailValid ? sendCode : undefined}
              />
              <TouchableOpacity
                style={[styles.button, (!emailValid || busy) && styles.buttonDisabled]}
                disabled={!emailValid || busy}
                onPress={sendCode}
              >
                {busy ? <ActivityIndicator color="#4C1D95" /> : <Text style={styles.buttonText}>Email me a code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter the code sent to {email.trim()}</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                placeholder="123456"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={10}
                onSubmitEditing={codeValid ? verifyCode : undefined}
              />
              <TouchableOpacity
                style={[styles.button, (!codeValid || busy) && styles.buttonDisabled]}
                disabled={!codeValid || busy}
                onPress={verifyCode}
              >
                {busy ? <ActivityIndicator color="#4C1D95" /> : <Text style={styles.buttonText}>Sign in</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('email'); setCode(''); }} style={styles.linkButton}>
                <Text style={styles.linkText}>Use a different email</Text>
              </TouchableOpacity>
            </>
          )}

          {showApple && step === 'email' && (
            <>
              <Text style={styles.or}>or</Text>
              <TouchableOpacity style={styles.appleButton} disabled={busy} onPress={() => run(signInWithApple)}>
                <MaterialCommunityIcons name="apple" size={20} color="#000000" />
                <Text style={styles.appleText}>Sign in with Apple</Text>
              </TouchableOpacity>
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: 48 },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 8 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 16, marginTop: 6 },
  label: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderRadius: 14,
    color: '#FFFFFF',
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  codeInput: { letterSpacing: 6, fontSize: 22, textAlign: 'center' },
  button: { backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#4C1D95', fontSize: 17, fontWeight: '700' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  or: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginVertical: 16 },
  appleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  appleText: { color: '#000000', fontSize: 17, fontWeight: '600' },
  error: { color: '#FCA5A5', marginTop: 16, textAlign: 'center' },
});
