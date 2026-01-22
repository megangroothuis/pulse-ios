import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ApiTestScreen: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>API Test</Text>
              <Text style={styles.subtitle}>Test Spotify & Strava Authentication</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.apiCard}>
                <View style={styles.apiHeader}>
                  <MaterialCommunityIcons name="music" size={32} color="#1DB954" style={styles.apiIcon} />
                  <Text style={styles.apiTitle}>Spotify</Text>
                </View>
                <Text style={styles.infoText}>Connect button coming soon</Text>
              </View>

              <View style={styles.apiCard}>
                <View style={styles.apiHeader}>
                  <MaterialCommunityIcons name="run" size={32} color="#FC4C02" style={styles.apiIcon} />
                  <Text style={styles.apiTitle}>Strava</Text>
                </View>
                <Text style={styles.infoText}>Connect button coming soon</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    // Using marginBottom on children instead of gap
  },
  apiCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  apiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  apiTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  apiIcon: {
    marginRight: 12,
  },
  infoText: {
    color: '#888',
    fontSize: 14,
  },
});
