import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { Session } from '../types';
import GenreBreakdown from '../components/GenreBreakdown';
import DualAxisChart from '../components/DualAxisChart';
import AIInsights from '../components/AIInsights';
import { IOSStatusBar } from '../components/IOSStatusBar';

type SessionDetailScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetail'>;
type SessionDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionDetail'>;

interface GridCell {
  songBPMRange: string;
  heartRateRange: string;
  minutes: number;
}

const HeatMap: React.FC<{ data: Session['heatMapData'] }> = ({ data }) => {
  // Define BPM ranges for song BPM (Y-axis)
  const songBPMRanges = [
    { label: '< 100', min: 0, max: 99 },
    { label: '100-119', min: 100, max: 119 },
    { label: '120-139', min: 120, max: 139 },
    { label: '140-159', min: 140, max: 159 },
    { label: '≥ 160', min: 160, max: 999 },
  ];

  // Define heart rate ranges (X-axis)
  const heartRateRanges = [
    { label: '1', min: 0, max: 119 },
    { label: '2', min: 120, max: 139 },
    { label: '3', min: 140, max: 159 },
    { label: '4', min: 160, max: 179 },
    { label: '5', min: 180, max: 999 },
  ];

  // Aggregate data into grid
  const gridData = useMemo(() => {
    const grid: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));
    
    data.forEach((point) => {
      // Find which row (song BPM range)
      const songBPMRow = songBPMRanges.findIndex(
        (range) => point.songBPM >= range.min && point.songBPM <= range.max
      );
      
      // Find which column (heart rate range)
      const heartRateCol = heartRateRanges.findIndex(
        (range) => point.heartRate >= range.min && point.heartRate <= range.max
      );
      
      if (songBPMRow >= 0 && heartRateCol >= 0) {
        grid[songBPMRow][heartRateCol] += point.durationMinutes;
      }
    });
    
    return grid;
  }, [data]);

  // Find max value for normalization
  const maxMinutes = Math.max(...gridData.flat(), 1);

  // Get color based on intensity (0 to 1) - Indigo to Fuchsia Pink gradient
  const getCellColor = (intensity: number) => {
    // Gradient: indigo (lowest) → purple → violet → magenta → pink → fuchsia pink (highest)
    if (intensity === 0) {
      return 'rgba(67, 56, 202, 0.3)'; // Indigo - lowest intensity
    } else if (intensity < 0.1) {
      return 'rgba(67, 56, 202, 0.4)'; // Indigo
    } else if (intensity < 0.2) {
      return 'rgba(79, 70, 229, 0.5)'; // Deep indigo
    } else if (intensity < 0.3) {
      return 'rgba(99, 102, 241, 0.6)'; // Purple-blue
    } else if (intensity < 0.4) {
      return 'rgba(124, 58, 237, 0.65)'; // Purple
    } else if (intensity < 0.5) {
      return 'rgba(139, 92, 246, 0.7)'; // Bright purple
    } else if (intensity < 0.6) {
      return 'rgba(168, 85, 247, 0.75)'; // Violet
    } else if (intensity < 0.7) {
      return 'rgba(192, 38, 211, 0.8)'; // Magenta
    } else if (intensity < 0.8) {
      return 'rgba(217, 70, 239, 0.85)'; // Bright magenta
    } else if (intensity < 0.9) {
      return 'rgba(236, 72, 153, 0.9)'; // Vibrant pink
    } else {
      return 'rgba(240, 0, 161, 1.0)'; // Fuchsia pink - MAXIMUM INTENSITY
    }
  };

  const totalDuration = data.reduce((sum, d) => sum + d.durationMinutes, 0);

  return (
    <View style={styles.heatMapContainer}>
      <View style={styles.heatMapHeader}>
        <Text style={styles.heatMapTitle}>BPM BY HEART RATE</Text>
        <Text style={styles.heatMapSubtitle}>
          {Math.round(totalDuration)} min total
        </Text>
      </View>
      
      <View style={styles.heatMapWrapper}>
        {/* Y-axis label */}
        <View style={styles.yAxisLabelContainer}>
          <Text style={styles.yAxisLabel}>SONG BPM</Text>
        </View>
        
        <View style={styles.heatMapContent}>
          {/* Y-axis values (left side) */}
          <View style={styles.yAxisValues}>
            {songBPMRanges.map((range, index) => (
              <View key={index} style={styles.yAxisValueCell}>
                <Text style={styles.axisValueText}>{range.label}</Text>
              </View>
            ))}
          </View>
          
          {/* Grid */}
          <View style={styles.gridContainer}>
            {gridData.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((minutes, colIndex) => {
                  const intensity = minutes / maxMinutes;
                  const cellColor = getCellColor(intensity);
                  return (
                    <View
                      key={colIndex}
                      style={[
                        styles.gridCell,
                        { backgroundColor: cellColor },
                      ]}
                    >
                      {minutes > 0 && (
                        <Text style={styles.cellMinutesText}>
                          {Math.round(minutes)}m
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
        
        {/* X-axis label and values (bottom) */}
        <View style={styles.xAxisContainer}>
          <View style={styles.xAxisSpacer} />
          <View style={styles.xAxisValues}>
            {heartRateRanges.map((range, index) => (
              <View key={index} style={styles.xAxisValueCell}>
                <Text style={styles.axisValueText}>{range.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.xAxisLabelContainer}>
          <Text style={styles.xAxisLabel}>HEART RATE RANGE</Text>
        </View>
      </View>
    </View>
  );
};

export const SessionDetailScreen: React.FC = () => {
  const navigation = useNavigation<SessionDetailScreenNavigationProp>();
  const route = useRoute<SessionDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const rawSession = route.params.session;
  
  // Convert ISO string back to Date object
  const session: Session = {
    ...rawSession,
    timestamp: new Date(rawSession.timestamp),
  };
  
  const [isLiked, setIsLiked] = useState(session.isLiked);
  const [bumps, setBumps] = useState(session.bumps);

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

  const getWorkoutIcon = (workoutType: string): string => {
    switch (workoutType.toLowerCase()) {
      case 'running':
        return 'run';
      case 'cycling':
        return 'bike';
      case 'yoga':
        return 'yoga';
      default:
        return 'dumbbell';
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
          <Text style={styles.headerTitle}>Session Details</Text>
          <View style={styles.headerSpacer} />
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
                <Text style={styles.avatarText}>{session.userName[0].toUpperCase()}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{session.userName}</Text>
                <Text style={styles.timestamp}>{formatTimeAgo(session.timestamp)}</Text>
              </View>
            </View>
            <View style={styles.headerBadges}>
              <View style={styles.typeBadge}>
                <MaterialCommunityIcons name="heart-pulse" size={16} color="#EC4899" />
              </View>
              <View style={styles.workoutTypeBadge}>
                <MaterialCommunityIcons 
                  name={getWorkoutIcon(session.workoutType) as any} 
                  size={16} 
                  color="#93C5FD" 
                />
              </View>
            </View>
          </View>

          {/* Session Title and Description */}
          {(session.title || session.description) && (
            <View style={styles.sessionInfoSection}>
              {session.title && (
                <Text style={styles.sessionTitle}>{session.title}</Text>
              )}
              {session.description && (
                <Text style={styles.sessionDescription}>{session.description}</Text>
              )}
            </View>
          )}

          {/* AI Insights */}
          <AIInsights session={session} />

          {/* Primary Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{session.songs.length}</Text>
              <Text style={styles.metricLabel}>Songs</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{session.artists.length}</Text>
              <Text style={styles.metricLabel}>Artists</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.heartRateValue]}>{session.peakHeartRate}</Text>
              <Text style={styles.metricLabel}>Peak BPM</Text>
            </View>
          </View>

          {/* Heat Map */}
          <HeatMap data={session.heatMapData} />

          {/* Dual Axis Chart */}
          <DualAxisChart data={session.heatMapData} />

          {/* Genre Breakdown */}
          <GenreBreakdown 
            genres={session.genres}
            heatMapData={session.heatMapData}
            peakHeartRate={session.peakHeartRate}
          />

          {/* Power Song Highlight */}
          <View style={styles.powerSongSection}>
            <View style={styles.powerSongHeader}>
              <Text style={styles.powerSongLabel}>⚡ Power Song</Text>
            </View>
            <Text style={styles.powerSongValue}>{session.powerSong}</Text>
          </View>

          {/* Setlist Button */}
          <TouchableOpacity 
            style={styles.setlistButton}
            onPress={() => {
              // Convert session to setlist format
              const setlist = {
                id: `setlist-${session.id}`,
                userId: session.userId,
                userName: session.userName,
                userAvatar: session.userAvatar,
                playlistName: session.title || `${session.workoutType} Session`,
                description: session.description || `Songs from ${session.userName}'s ${session.workoutType} session`,
                songCount: session.songs.length,
                songs: session.songs.map((songName, index) => {
                  // Find average BPM for this song from heatMapData
                  const songData = session.heatMapData.filter(p => p.songName === songName);
                  const avgBPM = songData.length > 0
                    ? songData.reduce((sum, p) => sum + p.songBPM, 0) / songData.length
                    : 120;
                  const avgHR = songData.length > 0
                    ? songData.reduce((sum, p) => sum + p.heartRate, 0) / songData.length
                    : 140;
                  // Map heart rate to energy (0-100 scale)
                  const energy = Math.min(100, Math.max(0, ((avgHR - 60) / 120) * 100));
                  
                  return {
                    name: songName,
                    tempo: Math.round(avgBPM),
                    energy: Math.round(energy),
                  };
                }),
                timestamp: session.timestamp,
                bumps: session.bumps,
                isLiked: session.isLiked,
              };
              
              // Serialize for navigation
              const serializedSetlist = {
                ...setlist,
                timestamp: setlist.timestamp.toISOString(),
              };
              
              navigation.navigate('SetlistDetail', { setlist: serializedSetlist });
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="playlist-music" size={20} color="#FFFFFF" />
            <Text style={styles.setlistButtonText}>This Session's Setlist</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>

          {/* Bumps */}
          <TouchableOpacity style={styles.bumpsContainer} onPress={handleBump} activeOpacity={0.7}>
            <MaterialCommunityIcons 
              name={isLiked ? "heart-pulse" : "heart-outline"} 
              size={18} 
              color={isLiked ? "#EC4899" : "rgba(255, 255, 255, 0.6)"} 
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
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.5)',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  sessionInfoSection: {
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sessionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
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
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginHorizontal: -4,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  heartRateValue: {
    color: '#F472B6',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heatMapContainer: {
    marginBottom: 24,
  },
  heatMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heatMapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
  heatMapSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heatMapWrapper: {
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  yAxisLabelContainer: {
    marginBottom: 8,
    paddingLeft: 50,
    width: 50,
    alignItems: 'center',
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heatMapContent: {
    flexDirection: 'row',
  },
  yAxisValues: {
    width: 50,
    marginRight: 8,
  },
  yAxisValueCell: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  gridContainer: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    height: 32,
  },
  gridCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 30,
  },
  cellMinutesText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  xAxisContainer: {
    flexDirection: 'row',
    marginTop: 2,
  },
  xAxisSpacer: {
    width: 50,
    marginRight: 8,
  },
  xAxisValues: {
    flex: 1,
    flexDirection: 'row',
  },
  xAxisValueCell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
  },
  axisValueText: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  xAxisLabelContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  powerSongSection: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  powerSongHeader: {
    marginBottom: 8,
  },
  powerSongLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  powerSongValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  setlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  setlistButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bumpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  bumpsText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 6,
  },
  bumpsTextLiked: {
    color: '#EC4899',
  },
});
