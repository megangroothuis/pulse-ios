import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { Sync } from '../types';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { useSavedItems } from '../context/SavedItemsContext';

type SyncDetailScreenRouteProp = RouteProp<RootStackParamList, 'SyncDetail'>;
type SyncDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SyncDetail'>;

export const SyncDetailScreen: React.FC = () => {
  const navigation = useNavigation<SyncDetailScreenNavigationProp>();
  const route = useRoute<SyncDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const rawSync = route.params.sync;
  
  // Convert ISO string back to Date object
  const sync: Sync = {
    ...rawSync,
    timestamp: new Date(rawSync.timestamp),
    segments: rawSync.segments.map(segment => ({
      ...segment,
      songs: segment.songs?.map(song => ({ ...song })),
    })),
  };
  
  const [isLiked, setIsLiked] = useState(sync.isLiked);
  const [bumps, setBumps] = useState(sync.bumps);
  const { isSyncSaved, saveSync, unsaveSync } = useSavedItems();
  const [isSaved, setIsSaved] = useState(() => isSyncSaved(sync.id));

  // Update saved state when context changes
  React.useEffect(() => {
    setIsSaved(isSyncSaved(sync.id));
  }, [isSyncSaved, sync.id]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const handleBump = () => {
    if (isLiked) {
      setIsLiked(false);
      setBumps(bumps - 1);
    } else {
      setIsLiked(true);
      setBumps(bumps + 1);
    }
  };

  const handleSave = () => {
    if (isSaved) {
      unsaveSync(sync.id);
      setIsSaved(false);
    } else {
      saveSync(sync);
      setIsSaved(true);
    }
  };

  const getWorkoutIcon = (workoutType: string): string => {
    switch (workoutType.toLowerCase()) {
      case 'running':
        return 'run';
      case 'cycling':
        return 'bike';
      case 'yoga':
        return 'yoga';
      case 'hiit':
        return 'fire';
      case 'weightlifting':
        return 'dumbbell';
      case 'free weights':
        return 'weight-lifter';
      case 'rowing':
        return 'rowing';
      default:
        return 'dumbbell';
    }
  };

  const getIntensityColor = (intensity: string): string => {
    switch (intensity.toLowerCase()) {
      case 'light':
        return '#60A5FA';
      case 'moderate':
        return '#A78BFA';
      case 'intense':
        return '#F87171';
      case 'extreme':
        return '#FB7185';
      default:
        return '#A78BFA';
    }
  };

  const getSongPartLabel = (part?: string): string => {
    if (!part) return '';
    switch (part) {
      case 'intro':
        return 'Intro';
      case 'verse':
        return 'Verse';
      case 'chorus':
        return 'Chorus';
      case 'bridge':
        return 'Bridge';
      case 'outro':
        return 'Outro';
      case 'full':
        return 'Full Song';
      default:
        return '';
    }
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
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Details</Text>
          <TouchableOpacity 
            onPress={handleSave}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isSaved ? "#34D399" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{sync.userName[0].toUpperCase()}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{sync.userName}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(sync.timestamp)}</Text>
              </View>
            </View>
            <View style={styles.headerBadges}>
              <View style={styles.typeBadge}>
                <MaterialCommunityIcons name="sync" size={16} color="#34D399" />
              </View>
              <View style={styles.workoutTypeBadge}>
                <MaterialCommunityIcons 
                  name={getWorkoutIcon(sync.workoutType) as any} 
                  size={16} 
                  color="#93C5FD" 
                />
              </View>
            </View>
          </View>

          {/* Sync Title and Description */}
          <View style={styles.syncInfoSection}>
            <Text style={styles.syncTitle}>{sync.title}</Text>
            {sync.description && (
              <Text style={styles.syncDescription}>{sync.description}</Text>
            )}
          </View>

          {/* Workout Info */}
          <View style={styles.workoutInfoSection}>
            <View style={styles.workoutInfoRow}>
              <View style={styles.workoutInfoBadge}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#34D399" />
                <Text style={styles.workoutInfoText}>{sync.duration}</Text>
              </View>
              <View style={[styles.workoutInfoBadge, { borderColor: getIntensityColor(sync.intensity) }]}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={16} 
                  color={getIntensityColor(sync.intensity)} 
                />
                <Text style={[styles.workoutInfoText, { color: getIntensityColor(sync.intensity) }]}>
                  {sync.intensity}
                </Text>
              </View>
              {sync.playlistName && (
                <View style={styles.workoutInfoBadge}>
                  <MaterialCommunityIcons name="music-note" size={16} color="#C4B5FD" />
                  <Text style={styles.workoutInfoText}>{sync.playlistName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Music Stats */}
          <View style={styles.musicStatsSection}>
            <Text style={styles.sectionTitle}>Playlist Analysis</Text>
            <View style={styles.musicStatsRow}>
              <View style={styles.musicStatCard}>
                <Text style={styles.musicStatLabel}>Avg Tempo</Text>
                <Text style={[styles.musicStatValue, { color: '#34D399' }]}>
                  {sync.avgTempo} BPM
                </Text>
              </View>
              <View style={styles.musicStatCard}>
                <Text style={styles.musicStatLabel}>Energy</Text>
                <Text style={[styles.musicStatValue, { color: '#34D399' }]}>
                  {sync.avgEnergy}%
                </Text>
              </View>
              <View style={styles.musicStatCard}>
                <Text style={styles.musicStatLabel}>Segments</Text>
                <Text style={[styles.musicStatValue, { color: '#C4B5FD' }]}>
                  {sync.segments.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Segments */}
          <View style={styles.segmentsSection}>
            <Text style={styles.sectionTitle}>Workout Phases</Text>
            {sync.segments.map((segment, index) => (
              <View key={segment.id || index} style={styles.segmentCard}>
                <View style={styles.segmentHeader}>
                  <View style={styles.segmentNumber}>
                    <Text style={styles.segmentNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.segmentInfo}>
                    <Text style={styles.segmentPhase}>{segment.phase}</Text>
                    <Text style={styles.segmentDuration}>{segment.duration}</Text>
                  </View>
                  <View style={styles.segmentStats}>
                    <View style={styles.segmentStat}>
                      <MaterialCommunityIcons name="metronome" size={12} color="#34D399" />
                      <Text style={styles.segmentStatText}>{segment.tempo} BPM</Text>
                    </View>
                    <View style={styles.segmentStat}>
                      <MaterialCommunityIcons name="fire" size={12} color="#F87171" />
                      <Text style={styles.segmentStatText}>{segment.energy}%</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.segmentDescription}>{segment.description}</Text>
                
                {/* Songs for this segment */}
                {segment.songs && segment.songs.length > 0 && (
                  <View style={styles.segmentSongs}>
                    <Text style={styles.segmentSongsLabel}>Songs:</Text>
                    {segment.songs.map((song, songIndex) => (
                      <View key={songIndex} style={styles.songItem}>
                        <MaterialCommunityIcons name="music-note" size={14} color="#C4B5FD" />
                        <Text style={styles.songName}>{song.name}</Text>
                        {segment.songPart && songIndex === 0 && (
                          <View style={styles.songPartBadge}>
                            <Text style={styles.songPartText}>
                              {getSongPartLabel(segment.songPart)}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Bumps */}
          <TouchableOpacity 
            style={styles.bumpsContainer} 
            onPress={handleBump} 
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isLiked ? "heart-pulse" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#34D399" : "rgba(255, 255, 255, 0.6)"} 
            />
            <Text style={[styles.bumpsText, isLiked && styles.bumpsTextLiked]}>
              {bumps} {bumps === 1 ? 'bump' : 'bumps'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  saveButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 211, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTypeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncInfoSection: {
    marginBottom: 24,
  },
  syncTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  syncDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
  },
  workoutInfoSection: {
    marginBottom: 24,
  },
  workoutInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  workoutInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  workoutInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
  },
  musicStatsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  musicStatsRow: {
    flexDirection: 'row',
    marginHorizontal: -3,
  },
  musicStatCard: {
    flex: 1,
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  musicStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  musicStatValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  segmentsSection: {
    marginBottom: 24,
  },
  segmentCard: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  segmentNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  segmentNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentInfo: {
    flex: 1,
    marginLeft: 4,
  },
  segmentPhase: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  segmentDuration: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  segmentStats: {
    flexDirection: 'row',
  },
  segmentStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  segmentDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 12,
  },
  segmentSongs: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentSongsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  songName: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  songPartBadge: {
    backgroundColor: 'rgba(196, 181, 253, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.3)',
  },
  songPartText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4B5FD',
    textTransform: 'uppercase',
  },
  bumpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginTop: 8,
  },
  bumpsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 6,
  },
  bumpsTextLiked: {
    color: '#34D399',
  },
});
