import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { Setlist } from '../types';
import { IOSStatusBar } from '../components/IOSStatusBar';
import { useSavedItems } from '../context/SavedItemsContext';

type SetlistDetailScreenRouteProp = RouteProp<RootStackParamList, 'SetlistDetail'>;
type SetlistDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SetlistDetail'>;

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

export const SetlistDetailScreen: React.FC = () => {
  const navigation = useNavigation<SetlistDetailScreenNavigationProp>();
  const route = useRoute<SetlistDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const rawSetlist = route.params.setlist;
  
  // Convert ISO string back to Date object
  const setlist: Setlist = {
    ...rawSetlist,
    timestamp: new Date(rawSetlist.timestamp),
  };
  
  const [isLiked, setIsLiked] = useState(setlist.isLiked);
  const [bumps, setBumps] = useState(setlist.bumps);
  const { isSetlistSaved, saveSetlist, unsaveSetlist } = useSavedItems();
  const [isSaved, setIsSaved] = useState(() => isSetlistSaved(setlist.id));

  // Update saved state when context changes
  React.useEffect(() => {
    setIsSaved(isSetlistSaved(setlist.id));
  }, [isSetlistSaved, setlist.id]);

  // Select cover image based on setlist ID for consistency
  const coverImage = useMemo(() => {
    if (defaultCoverImages.length > 0) {
      const index = parseInt(setlist.id) % defaultCoverImages.length;
      return defaultCoverImages[index];
    }
    return null;
  }, [setlist.id]);

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
      unsaveSetlist(setlist.id);
      setIsSaved(false);
    } else {
      saveSetlist(setlist);
      setIsSaved(true);
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
          <Text style={styles.headerTitle}>Setlist Details</Text>
          <TouchableOpacity 
            onPress={handleSave}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isSaved ? "#C4B5FD" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image Card */}
          {coverImage && (
            <View style={styles.coverCardContainer}>
              <Image 
                source={coverImage} 
                style={styles.coverCardImage}
                resizeMode="cover"
              />
              <View style={styles.coverCardOverlay} />
            </View>
          )}

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{setlist.userName[0].toUpperCase()}</Text>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>{setlist.userName}</Text>
                <View style={styles.songCountBadge}>
                  <Text style={styles.songCountText}>{setlist.songCount} songs</Text>
                </View>
              </View>
              <Text style={styles.timestamp}>{formatTimeAgo(setlist.timestamp)}</Text>
            </View>
          </View>

          {/* Playlist Title */}
          <View style={styles.titleSection}>
            <Text style={styles.playlistName}>{setlist.playlistName}</Text>
          </View>

          {/* Description */}
          {setlist.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionText}>{setlist.description}</Text>
            </View>
          )}

          {/* Tempo Chart */}
          <View style={styles.tempoChartSection}>
            <Text style={styles.chartTitle}>BPM Breakdown</Text>
            <View style={styles.tempoChartContainer}>
              {setlist.songs.map((song, index) => {
                const minTempo = Math.min(...setlist.songs.map(s => s.tempo));
                const maxTempo = Math.max(...setlist.songs.map(s => s.tempo));
                const tempoRange = maxTempo - minTempo || 1;
                const normalizedTempo = (song.tempo - minTempo) / tempoRange;
                
                // Color gradient from blue to pink based on tempo
                const getBarColor = (normalized: number) => {
                  // Blue (low) to Pink (high)
                  // Blue: rgb(59, 130, 246) -> Pink: rgb(236, 72, 153)
                  const r = Math.round(59 + (236 - 59) * normalized);
                  const g = Math.round(130 + (72 - 130) * normalized);
                  const b = Math.round(246 + (153 - 246) * normalized);
                  return `rgb(${r}, ${g}, ${b})`;
                };

                const barColor = getBarColor(normalizedTempo);
                const barHeight = Math.max(8, normalizedTempo * 60); // Min 8px, max 60px based on normalized tempo

                return (
                  <View key={index} style={styles.tempoBarWrapper}>
                    <View style={styles.tempoBarContainer}>
                      <View 
                        style={[
                          styles.tempoBar, 
                          { 
                            height: barHeight,
                            backgroundColor: barColor,
                          }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Songs List */}
          <View style={styles.songsSection}>
            <Text style={styles.sectionTitle}>Songs</Text>
            {setlist.songs.map((song, index) => (
              <View key={index} style={styles.songItem}>
                <Text style={styles.songNumber}>{index + 1}</Text>
                <View style={styles.songInfo}>
                  <Text style={styles.songName}>{song.name}</Text>
                  <View style={styles.songDetails}>
                    <View style={styles.tempoContainer}>
                      <MaterialCommunityIcons name="metronome" size={14} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.tempoText}>{song.tempo} BPM</Text>
                    </View>
                    <View style={styles.energyBarContainer}>
                      <View style={styles.energyBarBackground}>
                        <View 
                          style={[
                            styles.energyBarFill, 
                            { width: `${song.energy}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.energyValue}>{song.energy}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Bumps */}
          <TouchableOpacity style={styles.bumpsContainer} onPress={handleBump} activeOpacity={0.7}>
            <MaterialCommunityIcons 
              name={isLiked ? "heart-pulse" : "heart-outline"} 
              size={18} 
              color={isLiked ? "#C4B5FD" : "rgba(255, 255, 255, 0.6)"} 
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
    zIndex: 0,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientAccent1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientAccent2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  gradientAccent3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
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
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveButton: {
    padding: 4,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    marginHorizontal: -4,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  songCountBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    marginLeft: 4,
  },
  songCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4B5FD',
    letterSpacing: 0.3,
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  coverCardContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  coverCardImage: {
    width: '100%',
    height: '100%',
  },
  coverCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  titleSection: {
    marginBottom: 8,
    marginTop: -4,
  },
  playlistName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tempoChartSection: {
    marginBottom: 16,
    padding: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  tempoChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingVertical: 8,
    marginHorizontal: -2,
  },
  tempoBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    marginHorizontal: 2,
  },
  tempoBarContainer: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempoBar: {
    width: '100%',
    minHeight: 4,
    borderRadius: 2,
  },
  tempoBarLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  songsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  songNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginRight: 2,
    minWidth: 24,
    marginTop: 2,
  },
  songInfo: {
    flex: 1,
  },
  songName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  songDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tempoText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 150,
  },
  energyLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    minWidth: 45,
  },
  energyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 120,
    marginLeft: 8,
  },
  energyBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: '#C4B5FD',
    borderRadius: 3,
  },
  energyValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4B5FD',
    minWidth: 35,
    textAlign: 'right',
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
    color: '#A855F7',
  },
});
