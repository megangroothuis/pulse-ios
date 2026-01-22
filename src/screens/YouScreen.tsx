import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { SetlistCard } from '../components/SetlistCard';
import { SyncCard } from '../components/SyncCard';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { Setlist, Sync } from '../types';
import { mockCurrentUser } from '../data/mockData';
import { useSavedItems } from '../context/SavedItemsContext';

// Import profile picture - try with explicit path
const profilePicture = require('../assets/images/meganprofilepic.png') as number;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const YouScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'saves' | 'profile'>('profile');
  const { savedSetlists, savedSyncs } = useSavedItems();

  const renderCompactSetlist = ({ item }: { item: Setlist }) => {
    return <SetlistCard setlist={item} compact={true} />;
  };

  const renderCompactSync = ({ item }: { item: Sync }) => {
    return <SyncCard sync={item} compact={true} />;
  };

  const renderYourSaves = () => {
    // Combine saved setlists and syncs, sort by timestamp (newest first)
    const allSavedItems = [
      ...savedSetlists.map(setlist => ({ type: 'setlist' as const, data: setlist, timestamp: setlist.timestamp })),
      ...savedSyncs.map(sync => ({ type: 'sync' as const, data: sync, timestamp: sync.timestamp })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const renderItem = ({ item }: { item: typeof allSavedItems[0] }) => {
      if (item.type === 'setlist') {
        return <SetlistCard setlist={item.data} compact={true} />;
      } else {
        return <SyncCard sync={item.data} compact={true} />;
      }
    };

    return (
      <View style={styles.sectionContent}>
        {allSavedItems.length > 0 ? (
          <FlatList
            data={allSavedItems}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.type}-${item.data.id}`}
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={[styles.emptyState, { paddingBottom: 100 + insets.bottom }]}>
            <MaterialCommunityIcons name="bookmark-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyStateText}>No saves yet</Text>
            <Text style={styles.emptyStateSubtext}>Save setlists and syncs to access them here</Text>
          </View>
        )}
      </View>
    );
  };

  const renderProfile = () => {
    const user = mockCurrentUser;
    const musicAccounts = user.connectedAccounts.filter(acc => acc.type === 'music');
    const fitnessAccounts = user.connectedAccounts.filter(acc => acc.type === 'fitness');

    return (
      <View style={styles.sectionContent}>
        <ScrollView 
          style={styles.profileScrollView}
          contentContainerStyle={[styles.profileContainer, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={profilePicture} 
                style={styles.avatarImage}
                onError={(error) => console.log('Image error:', error)}
                onLoad={() => console.log('Image loaded successfully')}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{user.fullName}</Text>
              <Text style={styles.username}>@{user.username}</Text>
            </View>
          </View>

          {/* Followers/Following */}
          <View style={styles.socialStats}>
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{user.followers.toLocaleString()}</Text>
              <Text style={styles.socialStatLabel}>Followers</Text>
            </View>
            <View style={styles.socialStatDivider} />
            <View style={styles.socialStatItem}>
              <Text style={styles.socialStatValue}>{user.following.toLocaleString()}</Text>
              <Text style={styles.socialStatLabel}>Following</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="sync" size={24} color="#A78BFA" />
                <Text style={styles.statValue}>{user.totalSyncs}</Text>
                <Text style={styles.statLabel}>Total Syncs</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="heart-pulse" size={24} color="#EC4899" />
                <Text style={styles.statValue}>{user.sessionsCreated}</Text>
                <Text style={styles.statLabel}>Sessions Created</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="playlist-music" size={24} color="#60A5FA" />
                <Text style={styles.statValue}>{user.setlistsCreated}</Text>
                <Text style={styles.statLabel}>Setlists Created</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="record-rec" size={24} color="#F472B6" />
                <Text style={styles.statValue}>{user.sessionsRecorded}</Text>
                <Text style={styles.statLabel}>Sessions Recorded</Text>
              </View>
            </View>
          </View>

          {/* Connected Accounts */}
          <View style={styles.connectedAccountsSection}>
            <Text style={styles.sectionTitle}>Connected Accounts</Text>
            
            {/* Music Accounts */}
            <View style={styles.accountCategory}>
              <View style={styles.accountCategoryHeader}>
                <MaterialCommunityIcons name="music" size={18} color="#A78BFA" />
                <Text style={styles.accountCategoryTitle}>Music</Text>
              </View>
              {musicAccounts.map((account) => (
                <View key={account.id} style={styles.accountItem}>
                  <View style={styles.accountInfo}>
                    <MaterialCommunityIcons 
                      name={account.icon as any} 
                      size={20} 
                      color={account.connected ? "#A78BFA" : "rgba(255, 255, 255, 0.4)"} 
                    />
                    <Text style={[styles.accountName, !account.connected && styles.accountNameDisabled]}>
                      {account.name}
                    </Text>
                  </View>
                  <View style={[styles.accountStatus, account.connected && styles.accountStatusConnected]}>
                    <Text style={[styles.accountStatusText, account.connected && styles.accountStatusTextConnected]}>
                      {account.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Fitness Accounts */}
            <View style={styles.accountCategory}>
              <View style={styles.accountCategoryHeader}>
                <MaterialCommunityIcons name="dumbbell" size={18} color="#EC4899" />
                <Text style={styles.accountCategoryTitle}>Fitness</Text>
              </View>
              {fitnessAccounts.map((account) => (
                <View key={account.id} style={styles.accountItem}>
                  <View style={styles.accountInfo}>
                    <MaterialCommunityIcons 
                      name={account.icon as any} 
                      size={20} 
                      color={account.connected ? "#EC4899" : "rgba(255, 255, 255, 0.4)"} 
                    />
                    <Text style={[styles.accountName, !account.connected && styles.accountNameDisabled]}>
                      {account.name}
                    </Text>
                  </View>
                  <View style={[styles.accountStatus, account.connected && styles.accountStatusConnected]}>
                    <Text style={[styles.accountStatusText, account.connected && styles.accountStatusTextConnected]}>
                      {account.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Base gradient layer - deep blue to purple with curved transitions */}
      <LinearGradient
        colors={['#1E3A8A', '#312E81', '#4C1D95', '#6B21A8', '#7C3AED']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBase}
      />
      
      {/* Overlay gradient layer - deep magenta to raspberry */}
      <LinearGradient
        colors={['rgba(139, 26, 139, 0.6)', 'rgba(160, 32, 240, 0.5)', 'rgba(220, 20, 60, 0.4)', 'rgba(233, 30, 99, 0.3)']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      />
      
      {/* Top accent - deep magenta diffusion */}
      <LinearGradient
        colors={['rgba(139, 26, 139, 0.35)', 'rgba(160, 32, 240, 0.2)', 'rgba(160, 32, 240, 0.05)', 'transparent']}
        locations={[0, 0.25, 0.5, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.gradientAccent1}
      />
      
      {/* Middle accent - purple transition */}
      <LinearGradient
        colors={['transparent', 'rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.25)', 'rgba(124, 58, 237, 0.15)', 'transparent']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientAccent2}
      />
      
      {/* Bottom accent - raspberry diffusion */}
      <LinearGradient
        colors={['transparent', 'rgba(220, 20, 60, 0.15)', 'rgba(220, 20, 60, 0.3)', 'rgba(233, 30, 99, 0.25)']}
        locations={[0, 0.5, 0.75, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientAccent3}
      />
      
      {/* Main content */}
      <View style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="account" size={20} color="#FFFFFF" style={styles.titleIcon} />
              <Text style={styles.title}>You</Text>
            </View>
          </View>

          {/* Section Tabs */}
          <View style={styles.sectionTabs}>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeTab === 'profile' && styles.sectionTabTextActive]}>
                Profile
              </Text>
              {activeTab === 'profile' && <View style={styles.sectionTabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => setActiveTab('saves')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeTab === 'saves' && styles.sectionTabTextActive]}>
                Your Saves
              </Text>
              {activeTab === 'saves' && <View style={styles.sectionTabUnderline} />}
            </TouchableOpacity>
          </View>

          {/* Section Content */}
          {activeTab === 'profile' ? renderProfile() : renderYourSaves()}
        </SafeAreaView>
        
        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(20, insets.bottom) }]}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Mixdown')}
          >
            <Text style={styles.navText}>Today's Mix</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Studio')}
          >
            <Text style={styles.navText}>Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, styles.navTextActive]}>You</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    zIndex: -1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientAccent1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientAccent2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientAccent3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sectionTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sectionTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTabUnderline: {
    marginTop: 4,
    height: 2,
    width: '100%',
    backgroundColor: '#C4B5FD',
    borderRadius: 1,
  },
  sectionContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileScrollView: {
    flex: 1,
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.5)',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.5)',
    backgroundColor: 'transparent',
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  socialStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  socialStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  socialStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  connectedAccountsSection: {
    marginBottom: 24,
  },
  accountCategory: {
    marginBottom: 20,
  },
  accountCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountNameDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  accountStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountStatusConnected: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  accountStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountStatusTextConnected: {
    color: '#A78BFA',
  },
});
