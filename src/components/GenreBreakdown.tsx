import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GenreData, HeatMapDataPoint } from '../types';

// List of default cover image paths
const defaultCoverImages: any[] = [
  require('../assets/images/cover1.png'),
  require('../assets/images/cover2.png'),
  require('../assets/images/cover3.png'),
  require('../assets/images/cover4.png'),
  require('../assets/images/cover5.png'),
  require('../assets/images/cover6.png'),
  require('../assets/images/cover7.png'),
  require('../assets/images/cover8.png'),
  require('../assets/images/cover9.png'),
  require('../assets/images/cover10.png'),
  require('../assets/images/cover11.png'),
  require('../assets/images/cover12.png'),
  require('../assets/images/cover13.png'),
  require('../assets/images/cover14.png'),
];

interface GenreBreakdownProps {
  genres?: GenreData[];
  heatMapData: HeatMapDataPoint[];
  peakHeartRate: number;
}

const GenreBreakdown: React.FC<GenreBreakdownProps> = ({ genres, heatMapData, peakHeartRate }) => {
  // Calculate genres and badges from heatMapData if not provided
  const calculatedGenres = useMemo(() => {
    if (genres && genres.length > 0) {
      return genres;
    }

    // Group heatMapData by song name (as a proxy for genre)
    const songGroups: { [key: string]: HeatMapDataPoint[] } = {};
    heatMapData.forEach((point) => {
      if (!songGroups[point.songName]) {
        songGroups[point.songName] = [];
      }
      songGroups[point.songName].push(point);
    });

    // Calculate genre data from song groups
    const genreList: GenreData[] = [];
    
    // Map songs to genres (simplified - in real app, this would come from API)
    const songToGenre: { [key: string]: string } = {
      'Blinding Lights': 'Pop',
      'Levitating': 'Pop',
      'Circles': 'Pop',
      'SICKO MODE': 'Hip-Hop',
      'HUMBLE.': 'Hip-Hop',
      'No Role Modelz': 'Hip-Hop',
      'Holocene': 'Indie',
      'Tomorrow': 'Ambient',
      'On the Nature of Daylight': 'Classical',
      'Warm-up': 'Electronic',
      'Cool down': 'Electronic',
      'Meditation': 'Ambient',
      'Active': 'Electronic',
    };

    Object.entries(songGroups).forEach(([songName, points]) => {
      const genreName = songToGenre[songName] || 'Other';
      const durationMinutes = points.reduce((sum, p) => sum + p.durationMinutes, 0);
      
      // Calculate average BPM and heart rate
      const avgBPM = points.reduce((sum, p) => sum + p.songBPM, 0) / points.length;
      const avgHeartRate = points.reduce((sum, p) => sum + p.heartRate, 0) / points.length;
      const maxBPM = Math.max(...points.map(p => p.songBPM));
      const maxHeartRate = Math.max(...points.map(p => p.heartRate));

      // Calculate badges
      const badges: GenreData['badges'] = [];
      
      // Fastest pace: highest BPM
      if (maxBPM >= 160) {
        badges.push({ type: 'fastest-pace', label: 'Fastest Pace' });
      }
      
      // Recovery beats: low heart rate relative to song BPM
      if (avgHeartRate < 120 && avgBPM < 100) {
        badges.push({ type: 'recovery-beats', label: 'Recovery Beats' });
      }
      
      // Peak intensity: high heart rate
      if (maxHeartRate >= peakHeartRate * 0.9) {
        badges.push({ type: 'peak-intensity', label: 'Peak Intensity' });
      }
      
      // Steady rhythm: consistent BPM and heart rate
      const bpmVariance = points.reduce((sum, p) => sum + Math.abs(p.songBPM - avgBPM), 0) / points.length;
      const hrVariance = points.reduce((sum, p) => sum + Math.abs(p.heartRate - avgHeartRate), 0) / points.length;
      if (bpmVariance < 10 && hrVariance < 15) {
        badges.push({ type: 'steady-rhythm', label: 'Steady Rhythm' });
      }
      
      // Power boost: high BPM with high heart rate
      if (avgBPM >= 150 && avgHeartRate >= 160) {
        badges.push({ type: 'power-boost', label: 'Power Boost' });
      }

      // Check if genre already exists
      const existingGenre = genreList.find(g => g.name === genreName);
      if (existingGenre) {
        existingGenre.durationMinutes += durationMinutes;
        // Merge badges (avoid duplicates)
        badges.forEach(badge => {
          if (!existingGenre.badges.find(b => b.type === badge.type)) {
            existingGenre.badges.push(badge);
          }
        });
      } else {
        genreList.push({
          name: genreName,
          durationMinutes,
          badges,
        });
      }
    });

    return genreList.sort((a, b) => b.durationMinutes - a.durationMinutes);
  }, [genres, heatMapData, peakHeartRate]);

  const getBadgeIcon = (type: GenreData['badges'][0]['type']): string => {
    switch (type) {
      case 'fastest-pace':
        return 'speedometer';
      case 'recovery-beats':
        return 'heart-pulse';
      case 'peak-intensity':
        return 'fire';
      case 'steady-rhythm':
        return 'metronome';
      case 'power-boost':
        return 'lightning-bolt';
      default:
        return 'star';
    }
  };

  const getBadgeColor = (type: GenreData['badges'][0]['type']): string => {
    switch (type) {
      case 'fastest-pace':
        return '#F472B6'; // Pink
      case 'recovery-beats':
        return '#60A5FA'; // Blue
      case 'peak-intensity':
        return '#F87171'; // Red
      case 'steady-rhythm':
        return '#34D399'; // Green
      case 'power-boost':
        return '#FBBF24'; // Yellow
      default:
        return '#A78BFA'; // Purple
    }
  };

  if (calculatedGenres.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Genres</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {calculatedGenres.map((genre, index) => {
          // Select cover image based on genre index for consistency
          const coverImage = defaultCoverImages[index % defaultCoverImages.length];
          
          return (
            <View key={index} style={styles.genreCard}>
              {coverImage && (
                <View style={styles.coverContainer}>
                  <Image 
                    source={coverImage} 
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  <View style={styles.coverOverlay} />
                </View>
              )}
              <View style={styles.genreInfo}>
                <Text style={styles.genreName}>{genre.name}</Text>
                <Text style={styles.genreDuration}>{Math.round(genre.durationMinutes)} min</Text>
                <View style={styles.badgesContainer}>
                  {genre.badges.map((badge, badgeIndex) => (
                    <View 
                      key={badgeIndex} 
                      style={[styles.badge, { backgroundColor: `${getBadgeColor(badge.type)}20`, borderColor: `${getBadgeColor(badge.type)}40` }]}
                    >
                      <MaterialCommunityIcons 
                        name={getBadgeIcon(badge.type) as any} 
                        size={12} 
                        color={getBadgeColor(badge.type)} 
                      />
                      <Text style={[styles.badgeText, { color: getBadgeColor(badge.type) }]}>
                        {badge.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingRight: 20,
  },
  genreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 12,
  },
  coverContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  genreInfo: {
    padding: 16,
  },
  genreName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  genreDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 3,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginLeft: 6,
  },
});

export default GenreBreakdown;
