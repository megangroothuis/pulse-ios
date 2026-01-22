import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Session } from '../types';

interface SessionCardProps {
  session: Session;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GridCell {
  songBPMRange: string;
  heartRateRange: string;
  minutes: number;
}

const HeatMap: React.FC<{ data: Session['heatMapData'] }> = ({ data }) => {
  // Define BPM ranges for song BPM (Y-axis) - reversed so higher is at top
  const songBPMRanges = [
    { label: '≥ 160', min: 160, max: 999 },
    { label: '140-159', min: 140, max: 159 },
    { label: '120-139', min: 120, max: 139 },
    { label: '100-119', min: 100, max: 119 },
    { label: '< 100', min: 0, max: 99 },
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
          
          {/* Grid - reversed so higher BPM is at top */}
          <View style={styles.gridContainer}>
            {gridData.slice().reverse().map((row, rowIndex) => (
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
          <Text style={styles.xAxisLabel}>HEART RATE ZONES</Text>
        </View>
      </View>
    </View>
  );
};

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const navigation = useNavigation<NavigationProp>();
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

  const handlePress = () => {
    // Convert Date objects to ISO strings for serialization
    const serializedSession = {
      ...session,
      timestamp: session.timestamp.toISOString(),
      heatMapData: session.heatMapData.map(point => ({
        ...point,
      })),
    };
    navigation.navigate('SessionDetail', { session: serializedSession });
  };

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

        <View>
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

          {/* Power Song Highlight */}
          <View style={styles.powerSongSection}>
            <View style={styles.powerSongHeader}>
              <Text style={styles.powerSongLabel}>⚡ Power Song</Text>
            </View>
            <Text style={styles.powerSongValue}>{session.powerSong}</Text>
          </View>

          {/* Bumps */}
          <TouchableOpacity 
            style={styles.bumpsContainer} 
            onPress={handleBump} 
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isLiked ? "heart-pulse" : "heart-outline"} 
              size={18} 
              color={isLiked ? "#EC4899" : "rgba(255, 255, 255, 0.6)"} 
            />
            <Text style={[styles.bumpsText, isLiked && styles.bumpsTextLiked]}>
              {bumps} {bumps === 1 ? 'bump' : 'bumps'}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.5)',
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
  typeBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F472B6',
    letterSpacing: 0.3,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 6,
    marginHorizontal: -4,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  heartRateValue: {
    color: '#F472B6',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutTypeBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#93C5FD',
    letterSpacing: 0.3,
  },
  heatMapContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  heatMapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heatMapTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
  heatMapSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  heatMapWrapper: {
    backgroundColor: 'rgba(20, 20, 35, 0.6)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  yAxisLabelContainer: {
    marginBottom: 6,
    paddingLeft: 40,
  },
  yAxisLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heatMapContent: {
    flexDirection: 'row',
  },
  yAxisValues: {
    width: 40,
    marginRight: 6,
  },
  yAxisValueCell: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  gridContainer: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    height: 28,
  },
  gridCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 26,
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
    width: 40,
    marginRight: 6,
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
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  xAxisLabelContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  xAxisLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  powerSongSection: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  powerSongHeader: {
    marginBottom: 4,
  },
  powerSongLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  powerSongValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  bumpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bumpsText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 6,
  },
  bumpsTextLiked: {
    color: '#EC4899',
  },
});
