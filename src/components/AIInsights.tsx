import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Session, HeatMapDataPoint } from '../types';

interface AIInsightsProps {
  session: Session;
}

interface Insight {
  type: 'performance-boost' | 'peak-moment' | 'recovery' | 'consistency' | 'genre-impact';
  icon: string;
  message: string;
  value?: string;
}

const AIInsights: React.FC<AIInsightsProps> = ({ session }) => {
  const insights = useMemo(() => {
    const insightsList: Insight[] = [];

    // Analyze artist performance
    const artistPerformance: { [key: string]: { avgHeartRate: number; duration: number; count: number } } = {};
    
    session.heatMapData.forEach((point) => {
      // Find which artist this song belongs to (simplified mapping)
      const songToArtist: { [key: string]: string } = {
        'Blinding Lights': 'The Weeknd',
        'Levitating': 'Dua Lipa',
        'Circles': 'Post Malone',
        'SICKO MODE': 'Travis Scott',
        'HUMBLE.': 'Kendrick Lamar',
        'No Role Modelz': 'J. Cole',
        'Holocene': 'Bon Iver',
        'Tomorrow': 'Ólafur Arnalds',
        'On the Nature of Daylight': 'Max Richter',
        'Warm-up': 'Various',
        'Cool down': 'Various',
        'Meditation': 'Various',
        'Active': 'Various',
      };
      
      const artist = point.artist ?? (songToArtist[point.songName] || session.artists[0] || 'Unknown');
      
      if (!artistPerformance[artist]) {
        artistPerformance[artist] = { avgHeartRate: 0, duration: 0, count: 0 };
      }
      
      artistPerformance[artist].avgHeartRate += point.heartRate * point.durationMinutes;
      artistPerformance[artist].duration += point.durationMinutes;
      artistPerformance[artist].count += 1;
    });

    // Calculate average heart rates per artist
    Object.keys(artistPerformance).forEach(artist => {
      const data = artistPerformance[artist];
      data.avgHeartRate = data.avgHeartRate / data.duration;
    });

    // Find the artist with highest average heart rate (performance boost)
    const sortedArtists = Object.entries(artistPerformance)
      .filter(([artist]) => artist !== 'Various' && artist !== 'Unknown')
      .sort((a, b) => b[1].avgHeartRate - a[1].avgHeartRate);

    if (sortedArtists.length > 0) {
      const topArtist = sortedArtists[0];
      const avgHeartRate = session.heatMapData.reduce((sum, p) => sum + p.heartRate * p.durationMinutes, 0) / 
                          session.heatMapData.reduce((sum, p) => sum + p.durationMinutes, 0);
      const boost = ((topArtist[1].avgHeartRate - avgHeartRate) / avgHeartRate) * 100;
      
      if (boost > 5) {
        insightsList.push({
          type: 'performance-boost',
          icon: 'trending-up',
          message: `${topArtist[0]} boosts your performance by ${Math.round(boost)}%`,
          value: `${Math.round(boost)}%`,
        });
      }
    }

    // Peak moment analysis
    const peakMoment = session.heatMapData.reduce((max, point) => 
      point.heartRate > max.heartRate ? point : max, 
      session.heatMapData[0]
    );
    
    if (peakMoment && peakMoment.heartRate >= session.peakHeartRate * 0.95) {
      insightsList.push({
        type: 'peak-moment',
        icon: 'fire',
        message: `Peak intensity reached during "${peakMoment.songName}"`,
        value: `${Math.round(peakMoment.heartRate)} BPM`,
      });
    }

    // Recovery analysis
    const lowIntensityPoints = session.heatMapData.filter(
      p => p.heartRate < 120 && p.songBPM < 100
    );
    const recoveryDuration = lowIntensityPoints.reduce((sum, p) => sum + p.durationMinutes, 0);
    const totalDuration = session.heatMapData.reduce((sum, p) => sum + p.durationMinutes, 0);
    const recoveryPercentage = (recoveryDuration / totalDuration) * 100;

    if (recoveryPercentage > 15) {
      insightsList.push({
        type: 'recovery',
        icon: 'heart-pulse',
        message: `Strong recovery periods: ${Math.round(recoveryPercentage)}% of session`,
        value: `${Math.round(recoveryPercentage)}%`,
      });
    }

    // Consistency analysis
    const heartRateVariance = (() => {
      const avgHR = session.heatMapData.reduce((sum, p) => sum + p.heartRate * p.durationMinutes, 0) / 
                    session.heatMapData.reduce((sum, p) => sum + p.durationMinutes, 0);
      const variance = session.heatMapData.reduce((sum, p) => {
        const diff = p.heartRate - avgHR;
        return sum + (diff * diff * p.durationMinutes);
      }, 0) / session.heatMapData.reduce((sum, p) => sum + p.durationMinutes, 0);
      return Math.sqrt(variance);
    })();

    if (heartRateVariance < 15) {
      insightsList.push({
        type: 'consistency',
        icon: 'chart-line',
        message: 'Maintained consistent heart rate throughout',
        value: 'Steady',
      });
    }

    // Genre impact analysis
    const genrePerformance: { [key: string]: { avgHeartRate: number; duration: number } } = {};
    
    session.heatMapData.forEach((point) => {
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
      };
      
      const genre = point.genre ?? (songToGenre[point.songName] || 'Other');
      
      if (!genrePerformance[genre]) {
        genrePerformance[genre] = { avgHeartRate: 0, duration: 0 };
      }
      
      genrePerformance[genre].avgHeartRate += point.heartRate * point.durationMinutes;
      genrePerformance[genre].duration += point.durationMinutes;
    });

    Object.keys(genrePerformance).forEach(genre => {
      const data = genrePerformance[genre];
      data.avgHeartRate = data.avgHeartRate / data.duration;
    });

    const sortedGenres = Object.entries(genrePerformance)
      .sort((a, b) => b[1].avgHeartRate - a[1].avgHeartRate);

    if (sortedGenres.length > 0 && sortedGenres[0][1].duration > 5) {
      insightsList.push({
        type: 'genre-impact',
        icon: 'music-note',
        message: `${sortedGenres[0][0]} genre drove highest intensity`,
        value: `${Math.round(sortedGenres[0][1].avgHeartRate)} BPM avg`,
      });
    }

    return insightsList.slice(0, 4); // Limit to 4 insights
  }, [session]);

  if (insights.length === 0) {
    return null;
  }

  const getInsightColor = (type: Insight['type']): string => {
    switch (type) {
      case 'performance-boost':
        return '#F472B6'; // Pink
      case 'peak-moment':
        return '#F87171'; // Red
      case 'recovery':
        return '#60A5FA'; // Blue
      case 'consistency':
        return '#34D399'; // Green
      case 'genre-impact':
        return '#A78BFA'; // Purple
      default:
        return '#A78BFA';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="brain" size={18} color="#A78BFA" />
        <Text style={styles.title}>AI Insights</Text>
      </View>
      
      <View style={styles.insightsList}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: `${getInsightColor(insight.type)}20` }]}>
              <MaterialCommunityIcons 
                name={insight.icon as any} 
                size={16} 
                color={getInsightColor(insight.type)} 
              />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightMessage}>{insight.message}</Text>
              {insight.value && (
                <Text style={[styles.insightValue, { color: getInsightColor(insight.type) }]}>
                  {insight.value}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  insightsList: {
    // No styles needed
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
  },
  insightValue: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default AIInsights;
