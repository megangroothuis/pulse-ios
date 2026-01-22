import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { useAuthContext } from '../context/AuthContext';
import { useSpotifyOAuth, useStravaOAuth } from '../lib/auth';
import { getUserConnectedAccounts, markOnboardingComplete } from '../lib/db';

type AccountConnectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountConnection'>;

export const AccountConnectionScreen: React.FC = () => {
  const navigation = useNavigation<AccountConnectionScreenNavigationProp>();
  const { userId, refreshAuth } = useAuthContext();
  const spotifyOAuth = useSpotifyOAuth(userId);
  const stravaOAuth = useStravaOAuth(userId);

interface AccountOption {
  id: string;
  name: string;
  type: 'music' | 'fitness';
  icon: string;
  available: boolean;
  connecting: boolean;
  connected: boolean;
}

export const AccountConnectionScreen: React.FC = () => {
  const navigation = useNavigation<AccountConnectionScreenNavigationProp>();
  const { userId, refreshAuth } = useAuthContext();
  const { connectSpotify } = useSpotifyOAuth();
  const { connectStrava } = useStravaOAuth();

  const [accounts, setAccounts] = useState<AccountOption[]>([
    // Music accounts
    { id: 'spotify', name: 'Spotify', type: 'music', icon: 'spotify', available: true, connecting: false, connected: false },
    { id: 'apple-music', name: 'Apple Music', type: 'music', icon: 'apple', available: false, connecting: false, connected: false },
    { id: 'youtube-music', name: 'YouTube Music', type: 'music', icon: 'youtube', available: false, connecting: false, connected: false },
    // Fitness accounts
    { id: 'strava', name: 'Strava', type: 'fitness', icon: 'run', available: true, connecting: false, connected: false },
    { id: 'garmin', name: 'Garmin', type: 'fitness', icon: 'watch', available: false, connecting: false, connected: false },
    { id: 'fitbit', name: 'Fitbit', type: 'fitness', icon: 'watch-variant', available: false, connecting: false, connected: false },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnectedAccounts();
  }, [userId]);

  const loadConnectedAccounts = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const connectedAccounts = await getUserConnectedAccounts(userId);
      const connectedProviderIds = new Set(connectedAccounts.map(acc => acc.provider));

      setAccounts(prev => prev.map(acc => ({
        ...acc,
        connected: connectedProviderIds.has(acc.id),
      })));
    } catch (error) {
      console.error('Error loading connected accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (accountId: string) => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to connect accounts');
      return;
    }

    setAccounts(prev => prev.map(acc =>
      acc.id === accountId ? { ...acc, connecting: true } : acc
    ));

    try {
      if (accountId === 'spotify') {
        await spotifyOAuth.connectSpotify();
      } else if (accountId === 'strava') {
        await stravaOAuth.connectStrava();
      } else {
        Alert.alert('Coming Soon', `${accounts.find(a => a.id === accountId)?.name} integration is coming soon!`);
        setAccounts(prev => prev.map(acc =>
          acc.id === accountId ? { ...acc, connecting: false } : acc
        ));
        return;
      }

      // Reload connected accounts
      await loadConnectedAccounts();
      await refreshAuth();
    } catch (error: any) {
      Alert.alert('Connection Error', error.message || 'Failed to connect account. Please try again.');
      console.error('Connection error:', error);
    } finally {
      setAccounts(prev => prev.map(acc =>
        acc.id === accountId ? { ...acc, connecting: false } : acc
      ));
    }
  };

  const handleContinue = async () => {
    if (!userId) return;

    try {
      await markOnboardingComplete(userId);
      await refreshAuth();
      // Navigation will be handled by App.tsx
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      console.error('Error marking onboarding complete:', error);
    }
  };

  const musicAccounts = accounts.filter(acc => acc.type === 'music');
  const fitnessAccounts = accounts.filter(acc => acc.type === 'fitness');
  const connectedCount = accounts.filter(acc => acc.connected).length;
  const requiredConnected = accounts.filter(acc => acc.available && acc.connected).length;
  const canContinue = requiredConnected >= 2; // Spotify + Strava

  if (isLoading) {
    return (
      <View style={styles.container}>
        <IOSStatusBar />
        <LinearGradient
          colors={['#1E3A8A', '#312E81', '#4C1D95', '#6B21A8', '#7C3AED']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBase}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C4B5FD" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <IOSStatusBar />
      
      <LinearGradient
        colors={['#1E3A8A', '#312E81', '#4C1D95', '#6B21A8', '#7C3AED']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBase}
      />
      
      <LinearGradient
        colors={['rgba(139, 26, 139, 0.6)', 'rgba(160, 32, 240, 0.5)', 'rgba(220, 20, 60, 0.4)', 'rgba(233, 30, 99, 0.3)']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Connect Your Accounts</Text>
            <Text style={styles.subtitle}>
              Link your music and fitness accounts to get started
            </Text>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(requiredConnected / 2) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {requiredConnected} of 2 required accounts connected
            </Text>
          </View>

          {/* Music Accounts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Music Accounts</Text>
            {musicAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onConnect={() => handleConnect(account.id)}
              />
            ))}
          </View>

          {/* Fitness Accounts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Accounts</Text>
            {fitnessAccounts.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onConnect={() => handleConnect(account.id)}
              />
            ))}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>
              {canContinue ? 'Continue' : 'Connect Spotify & Strava to continue'}
            </Text>
          </TouchableOpacity>

          {/* Skip option */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleContinue}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

interface AccountCardProps {
  account: AccountOption;
  onConnect: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onConnect }) => {
  const isComingSoon = !account.available;
  const isConnected = account.connected;
  const isConnecting = account.connecting;

  return (
    <TouchableOpacity
      style={[
        styles.accountCard,
        isComingSoon && styles.accountCardDisabled,
        isConnected && styles.accountCardConnected,
      ]}
      onPress={isComingSoon ? undefined : onConnect}
      disabled={isComingSoon || isConnecting || isConnected}
    >
      <View style={styles.accountCardContent}>
        <View style={styles.accountIconContainer}>
          <MaterialCommunityIcons
            name={account.icon as any}
            size={24}
            color={isComingSoon ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF'}
          />
        </View>
        <View style={styles.accountInfo}>
          <Text
            style={[
              styles.accountName,
              isComingSoon && styles.accountNameDisabled,
            ]}
          >
            {account.name}
          </Text>
          {isComingSoon && (
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          )}
        </View>
        {isConnecting ? (
          <ActivityIndicator size="small" color="#C4B5FD" />
        ) : isConnected ? (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#34D399"
          />
        ) : !isComingSoon ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="rgba(255, 255, 255, 0.6)"
          />
        ) : null}
      </View>
    </TouchableOpacity>
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
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
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
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  accountCardDisabled: {
    opacity: 0.5,
  },
  accountCardConnected: {
    borderColor: 'rgba(52, 211, 153, 0.5)',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  accountCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountNameDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  comingSoonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  continueButton: {
    backgroundColor: '#C4B5FD',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
