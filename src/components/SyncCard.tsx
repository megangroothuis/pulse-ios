import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Sync } from '../types';
import { useSavedItems } from '../context/SavedItemsContext';

interface SyncCardProps {
  sync: Sync;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SyncCard: React.FC<SyncCardProps> = ({ sync, compact = false }) => {
  const navigation = useNavigation<NavigationProp>();
  const [isLiked, setIsLiked] = useState(sync.isLiked);
  const [bumps, setBumps] = useState(sync.bumps);
  const { isSyncSaved, saveSync, unsaveSync, getSyncSaveCount } = useSavedItems();
  const [isSaved, setIsSaved] = useState(() => isSyncSaved(sync.id));
  const [saveCount, setSaveCount] = useState(() => getSyncSaveCount(sync.id, sync.saves));

  // Update saved state when context changes
  React.useEffect(() => {
    setIsSaved(isSyncSaved(sync.id));
    setSaveCount(getSyncSaveCount(sync.id, sync.saves));
  }, [isSyncSaved, getSyncSaveCount, sync.id, sync.saves]);

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

  const handleSave = (e: any) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveSync(sync.id);
      setIsSaved(false);
      setSaveCount(prev => Math.max(0, prev - 1));
    } else {
      saveSync(sync);
      setIsSaved(true);
      setSaveCount(prev => prev + 1);
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

  const handlePress = () => {
    // Convert Date objects to ISO strings for serialization
    const serializedSync = {
      ...sync,
      timestamp: sync.timestamp.toISOString(),
      segments: sync.segments.map(segment => ({
        ...segment,
        songs: segment.songs?.map(song => ({ ...song })),
      })),
    };
    navigation.navigate('SyncDetail', { sync: serializedSync });
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactCardContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(52, 211, 153, 0.2)', 'rgba(52, 211, 153, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactCard}
        >
          <View style={styles.compactHeader}>
            <View style={styles.compactSyncIcon}>
              <MaterialCommunityIcons name="sync" size={20} color="#34D399" />
            </View>
            <View style={styles.compactContent}>
              <Text style={styles.compactTitle} numberOfLines={2}>{sync.title}</Text>
              <View style={styles.compactCreatorRow}>
                <MaterialCommunityIcons name="account" size={12} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.compactCreatorText}>by {sync.userName}</Text>
              </View>
              <View style={styles.compactInfoRow}>
                <View style={styles.compactInfoBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color="#34D399" />
                  <Text style={styles.compactInfoText}>{sync.duration}</Text>
                </View>
                <View style={[styles.compactInfoBadge, { borderColor: getIntensityColor(sync.intensity) }]}>
                  <MaterialCommunityIcons 
                    name="fire" 
                    size={12} 
                    color={getIntensityColor(sync.intensity)} 
                  />
                  <Text style={[styles.compactInfoText, { color: getIntensityColor(sync.intensity) }]}>
                    {sync.intensity}
                  </Text>
                </View>
                <View style={styles.compactInfoBadge}>
                  <MaterialCommunityIcons 
                    name={getWorkoutIcon(sync.workoutType) as any} 
                    size={12} 
                    color="#93C5FD" 
                  />
                  <Text style={styles.compactInfoText}>{sync.workoutType}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
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

        <View>
          {/* Title and Description */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{sync.title}</Text>
            {sync.description && (
              <Text style={styles.description}>{sync.description}</Text>
            )}
          </View>

          {/* Workout Info */}
          <View style={styles.workoutInfo}>
            <View style={styles.workoutInfoRow}>
              <View style={styles.workoutInfoBadge}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#34D399" />
                <Text style={styles.workoutInfoText}>{sync.duration}</Text>
              </View>
              <View style={[styles.workoutInfoBadge, { borderColor: getIntensityColor(sync.intensity) }]}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={14} 
                  color={getIntensityColor(sync.intensity)} 
                />
                <Text style={[styles.workoutInfoText, { color: getIntensityColor(sync.intensity) }]}>
                  {sync.intensity}
                </Text>
              </View>
              {sync.playlistName && (
                <View style={styles.workoutInfoBadge}>
                  <MaterialCommunityIcons name="music-note" size={14} color="#C4B5FD" />
                  <Text style={styles.workoutInfoText}>{sync.playlistName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Segments Preview */}
          <View style={styles.segmentsContainer}>
            <Text style={styles.segmentsTitle}>Workout Phases</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.segmentsScrollContent}
            >
              {sync.segments.slice(0, 4).map((segment, index) => (
                <View key={segment.id || index} style={styles.segmentCard}>
                  <View style={styles.segmentNumber}>
                    <Text style={styles.segmentNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.segmentPhase} numberOfLines={1}>
                    {segment.phase}
                  </Text>
                  <Text style={styles.segmentDuration}>{segment.duration}</Text>
                  <View style={styles.segmentStats}>
                    <View style={styles.segmentStat}>
                      <MaterialCommunityIcons name="metronome" size={10} color="#34D399" />
                      <Text style={styles.segmentStatText}>{segment.tempo}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {sync.segments.length > 4 && (
                <View style={styles.moreSegments}>
                  <Text style={styles.moreSegmentsText}>+{sync.segments.length - 4} more</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Music Stats */}
          <View style={styles.musicStats}>
            <View style={styles.musicStatItem}>
              <Text style={styles.musicStatLabel}>Avg Tempo</Text>
              <Text style={[styles.musicStatValue, { color: '#34D399' }]}>
                {sync.avgTempo} BPM
              </Text>
            </View>
            <View style={styles.musicStatItem}>
              <Text style={styles.musicStatLabel}>Energy</Text>
              <Text style={[styles.musicStatValue, { color: '#34D399' }]}>
                {sync.avgEnergy}%
              </Text>
            </View>
            <View style={styles.musicStatItem}>
              <Text style={styles.musicStatLabel}>Segments</Text>
              <Text style={[styles.musicStatValue, { color: '#C4B5FD' }]}>
                {sync.segments.length}
              </Text>
            </View>
          </View>

          {/* Bumps and Saves */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.bumpsContainer} 
              onPress={handleBump} 
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={isLiked ? "heart-pulse" : "heart-outline"} 
                size={18} 
                color={isLiked ? "#34D399" : "rgba(255, 255, 255, 0.6)"} 
              />
              <Text style={[styles.bumpsText, isLiked && styles.bumpsTextLiked]}>
                {bumps} {bumps === 1 ? 'bump' : 'bumps'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.savesContainer}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={isSaved ? "#34D399" : "rgba(255, 255, 255, 0.6)"} 
              />
              <Text style={[styles.savesText, isSaved && styles.savesTextActive]}>
                {saveCount} {saveCount === 1 ? 'save' : 'saves'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
  card: {
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.3)',
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 211, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    padding: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTypeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  titleSection: {
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  workoutInfo: {
    marginTop: 2,
  },
  workoutInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  workoutInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  workoutInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
  },
  segmentsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  segmentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34D399',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  segmentsScrollContent: {
    paddingRight: 4,
  },
  segmentCard: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 12,
    padding: 10,
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    marginRight: 8,
  },
  segmentNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  segmentNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  segmentPhase: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  segmentDuration: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  segmentStats: {
    flexDirection: 'row',
  },
  segmentStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentStatText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  moreSegments: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  moreSegmentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  musicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    marginTop: 2,
  },
  musicStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  musicStatLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  musicStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bumpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bumpsText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 6,
  },
  bumpsTextLiked: {
    color: '#34D399',
  },
  savesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savesText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 6,
  },
  savesTextActive: {
    color: '#34D399',
  },
  compactCardContainer: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  compactCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactSyncIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
    marginLeft: 4,
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  compactCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactCreatorText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 6,
  },
  compactInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  compactInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  compactInfoText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
  },
});
