import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { SessionCard } from '../components/SessionCard';
import { SetlistCard } from '../components/SetlistCard';
import { SyncCard } from '../components/SyncCard';
import { FeedItem, Setlist, Session, Sync } from '../types';
import { mockFeedData } from '../data/mockData';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export const MixdownScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'feed' | 'explore'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  // Current user ID (in a real app, this would come from auth context)
  const currentUserId = 'user1'; // Assuming current user is Alex

  // Filter items from people the user doesn't follow (for Explore section)
  const allExploreItems: (Setlist | Session | Sync)[] = mockFeedData
    .filter(item => item.data.userId !== currentUserId)
    .map(item => item.data);

  // AI-powered search filtering
  const exploreItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return allExploreItems;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // AI-powered semantic search - matches across setlists, sessions, and syncs
    return allExploreItems.filter(item => {
      // Check if item is a Setlist
      if ('playlistName' in item) {
        const setlist = item as Setlist;
        // Match playlist name
        if (setlist.playlistName.toLowerCase().includes(query)) return true;
        // Match description
        if (setlist.description?.toLowerCase().includes(query)) return true;
        // Match song names
        if (setlist.songs.some(song => song.name.toLowerCase().includes(query))) return true;
      }
      
      // Check if item is a Session
      if ('workoutType' in item && 'title' in item && 'heatMapData' in item) {
        const session = item as Session;
        // Match title
        if (session.title?.toLowerCase().includes(query)) return true;
        // Match description
        if (session.description?.toLowerCase().includes(query)) return true;
        // Match workout type
        if (session.workoutType.toLowerCase().includes(query)) return true;
        // Match song names
        if (session.songs.some(song => song.toLowerCase().includes(query))) return true;
        // Match artists
        if (session.artists.some(artist => artist.toLowerCase().includes(query))) return true;
      }
      
      // Check if item is a Sync
      if ('workoutType' in item && 'title' in item && 'segments' in item) {
        const sync = item as Sync;
        // Match title
        if (sync.title.toLowerCase().includes(query)) return true;
        // Match description
        if (sync.description?.toLowerCase().includes(query)) return true;
        // Match workout type
        if (sync.workoutType.toLowerCase().includes(query)) return true;
        // Match playlist name
        if (sync.playlistName?.toLowerCase().includes(query)) return true;
        // Match segments
        if (sync.segments.some(seg => 
          seg.phase.toLowerCase().includes(query) ||
          seg.description.toLowerCase().includes(query) ||
          seg.songs?.some(song => song.name.toLowerCase().includes(query))
        )) return true;
      }
      
      // Match workout types (semantic matching)
      const workoutKeywords: { [key: string]: string[] } = {
        'running': ['run', 'cardio', 'jog', 'sprint', 'marathon'],
        'cycling': ['bike', 'cycle', 'spin', 'pedal'],
        'weightlifting': ['lift', 'weights', 'strength', 'gym', 'muscle'],
        'hiit': ['hiit', 'interval', 'intense', 'high intensity'],
        'yoga': ['yoga', 'stretch', 'meditation', 'zen', 'calm'],
        'rowing': ['row', 'boat', 'water'],
      };
      
      for (const [workout, keywords] of Object.entries(workoutKeywords)) {
        if (keywords.some(keyword => query.includes(keyword))) {
          if ('workoutType' in item) {
            if ((item as Session | Sync).workoutType.toLowerCase().includes(workout)) return true;
          }
          if ('playlistName' in item) {
            const setlist = item as Setlist;
            if (setlist.playlistName.toLowerCase().includes(workout) ||
                setlist.description?.toLowerCase().includes(workout)) {
              return true;
            }
          }
        }
      }
      
      // Match tempo/BPM ranges
      let avgTempo = 0;
      if ('playlistName' in item) {
        const setlist = item as Setlist;
        avgTempo = setlist.songs.length > 0
          ? Math.round(setlist.songs.reduce((sum, song) => sum + song.tempo, 0) / setlist.songs.length)
          : 0;
      } else if ('avgTempo' in item) {
        avgTempo = (item as Sync).avgTempo;
      }
      
      if (query.includes('fast') || query.includes('high tempo') || query.includes('bpm')) {
        if (avgTempo >= 140) return true;
      }
      if (query.includes('slow') || query.includes('low tempo')) {
        if (avgTempo > 0 && avgTempo < 120) return true;
      }
      if (query.includes('medium') || query.includes('moderate')) {
        if (avgTempo >= 120 && avgTempo < 140) return true;
      }
      
      // Match genre keywords
      const genreKeywords: { [key: string]: string[] } = {
        'pop': ['pop', 'popular', 'mainstream'],
        'hip-hop': ['hip hop', 'hiphop', 'rap', 'urban'],
        'rock': ['rock', 'guitar', 'band'],
        'electronic': ['electronic', 'edm', 'dance', 'techno', 'house'],
        'r&b': ['r&b', 'rnb', 'soul', 'rhythm'],
        'country': ['country', 'folk', 'western'],
        'latin': ['latin', 'salsa', 'reggaeton'],
        'jazz': ['jazz', 'smooth'],
      };
      
      for (const [genre, keywords] of Object.entries(genreKeywords)) {
        if (keywords.some(keyword => query.includes(keyword))) {
          if ('playlistName' in item) {
            const setlist = item as Setlist;
            if (setlist.playlistName.toLowerCase().includes(genre) ||
                setlist.description?.toLowerCase().includes(genre) ||
                setlist.songs.some(song => song.name.toLowerCase().includes(genre))) {
              return true;
            }
          }
          if ('songs' in item && Array.isArray(item.songs) && typeof item.songs[0] === 'string') {
            const session = item as Session;
            if (session.songs.some(song => song.toLowerCase().includes(genre))) return true;
          }
        }
      }
      
      return false;
    });
  }, [searchQuery, allExploreItems]);

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'session') {
      return <SessionCard session={item.data} />;
    } else if (item.type === 'setlist') {
      return <SetlistCard setlist={item.data} />;
    } else if (item.type === 'sync') {
      return <SyncCard sync={item.data} />;
    }
    return null;
  };

  const renderGridSetlist = ({ item, index }: { item: Setlist; index: number }) => {
    // Safely get cover image - handle non-numeric IDs
    const idNum = parseInt(item.id) || index;
    const coverImage = defaultCoverImages[Math.abs(idNum) % defaultCoverImages.length];
    
    // Create more dramatic height variations for masonry effect
    const heightVariations = [70, 140, 90, 160, 80, 130, 100, 150, 75, 145, 95, 125, 85, 135, 110, 155, 65, 120];
    const coverHeight = heightVariations[index % heightVariations.length];

    const handlePress = () => {
      const serializedSetlist = {
        ...item,
        timestamp: item.timestamp.toISOString(),
        songs: item.songs?.map(song => ({ ...song })) || [],
      };
      navigation.navigate('SetlistDetail', { setlist: serializedSetlist });
    };

    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gridCardGradient}
        >
          {coverImage && (
            <View style={[styles.gridCoverContainer, { height: coverHeight }]}>
              <Image 
                source={coverImage} 
                style={styles.gridCoverImage}
                resizeMode="cover"
              />
              <View style={styles.gridCoverOverlay} />
            </View>
          )}
          <View style={styles.gridCardContent}>
            <Text style={styles.gridCardTitle}>
              {item.playlistName}
            </Text>
            <View style={styles.gridCardUser}>
              <View style={[styles.gridAvatar, { marginRight: 6 }]}>
                <Text style={styles.gridAvatarText}>{item.userName[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.gridCardUserName} numberOfLines={1}>
                {item.userName}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Mini Heat Map for Session grid cards
  const renderMiniHeatMap = (session: Session) => {
    const songBPMRanges = [
      { min: 160, max: 999 },
      { min: 140, max: 159 },
      { min: 120, max: 139 },
      { min: 100, max: 119 },
      { min: 0, max: 99 },
    ];

    const heartRateRanges = [
      { min: 0, max: 119 },
      { min: 120, max: 139 },
      { min: 140, max: 159 },
      { min: 160, max: 179 },
      { min: 180, max: 999 },
    ];

    const grid = Array(5).fill(null).map(() => Array(5).fill(0));
    session.heatMapData.forEach((point) => {
      const row = songBPMRanges.findIndex(r => point.songBPM >= r.min && point.songBPM <= r.max);
      const col = heartRateRanges.findIndex(r => point.heartRate >= r.min && point.heartRate <= r.max);
      if (row >= 0 && col >= 0) {
        grid[row][col] += point.durationMinutes;
      }
    });

    const maxMinutes = Math.max(...grid.flat(), 1);

    const getCellColor = (intensity: number) => {
      if (intensity === 0) return 'rgba(67, 56, 202, 0.3)';
      if (intensity < 0.3) return 'rgba(124, 58, 237, 0.65)';
      if (intensity < 0.6) return 'rgba(168, 85, 247, 0.75)';
      if (intensity < 0.8) return 'rgba(217, 70, 239, 0.85)';
      return 'rgba(240, 0, 161, 1.0)';
    };

    return (
      <View style={styles.miniHeatMap}>
        {grid.slice().reverse().map((row, rowIndex) => (
          <View key={rowIndex} style={styles.miniHeatMapRow}>
            {row.map((minutes, colIndex) => {
              const intensity = minutes / maxMinutes;
              return (
                <View
                  key={colIndex}
                  style={[
                    styles.miniHeatMapCell,
                    { backgroundColor: getCellColor(intensity) },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderGridSession = ({ item, index }: { item: Session; index: number }) => {
    const handlePress = () => {
      const serializedSession = {
        ...item,
        timestamp: item.timestamp.toISOString(),
        heatMapData: item.heatMapData?.map(point => ({ ...point })) || [],
        songs: item.songs?.map(song => song) || [],
        artists: item.artists?.map(artist => artist) || [],
        genres: item.genres?.map(genre => ({ ...genre })) || [],
      };
      navigation.navigate('SessionDetail', { session: serializedSession });
    };

    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gridCardGradient}
        >
          <View style={styles.gridCardContent}>
            <Text style={styles.gridCardTitle}>
              {item.title || `${item.workoutType} Session`}
            </Text>
            <View style={styles.miniHeatMapContainer}>
              {renderMiniHeatMap(item)}
            </View>
            <View style={styles.gridCardUser}>
              <View style={[styles.gridAvatar, { marginRight: 6 }]}>
                <Text style={styles.gridAvatarText}>{item.userName[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.gridCardUserName} numberOfLines={1}>
                {item.userName}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Green Tempo Bar Chart for Sync grid cards
  const renderTempoBarChart = (sync: Sync) => {
    if (!sync.segments || sync.segments.length === 0) {
      return null;
    }
    
    const tempos = sync.segments.map(seg => seg.tempo);
    const minTempo = Math.min(...tempos);
    const maxTempo = Math.max(...tempos);
    const tempoRange = maxTempo - minTempo || 1;
    const maxBarHeight = 36;

    return (
      <View style={styles.tempoBarChart}>
        {sync.segments.map((segment, index) => {
          const normalized = tempoRange > 0 ? (segment.tempo - minTempo) / tempoRange : 0.5;
          const barHeight = Math.max(12, normalized * maxBarHeight + 12); // Min 12px, max 48px
          return (
            <View key={segment.id || index} style={styles.tempoBarWrapper}>
              <View
                style={[
                  styles.tempoBar,
                  {
                    height: barHeight,
                    backgroundColor: '#34D399', // Green color
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const renderGridSync = ({ item, index }: { item: Sync; index: number }) => {
    const handlePress = () => {
      const serializedSync = {
        ...item,
        timestamp: item.timestamp.toISOString(),
        segments: item.segments?.map(segment => ({
          ...segment,
          songs: segment.songs?.map(song => ({ ...song })) || [],
        })) || [],
      };
      navigation.navigate('SyncDetail', { sync: serializedSync });
    };

    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gridCardGradient}
        >
          <View style={styles.gridCardContent}>
            <Text style={styles.gridCardTitle}>
              {item.title}
            </Text>
            <View style={styles.tempoBarChartContainer}>
              {renderTempoBarChart(item)}
            </View>
            <View style={styles.gridCardUser}>
              <View style={[styles.gridAvatar, { marginRight: 6 }]}>
                <Text style={styles.gridAvatarText}>{item.userName[0].toUpperCase()}</Text>
              </View>
              <Text style={styles.gridCardUserName} numberOfLines={1}>
                {item.userName}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderExploreItem = ({ item, index }: { item: Setlist | Session | Sync; index: number }) => {
    // Check type and render appropriate grid card
    // Check for Sync first (has segments and workoutType, but may also have playlistName)
    if ('segments' in item && 'workoutType' in item) {
      // It's a Sync
      return renderGridSync({ item: item as Sync, index });
    } else if ('heatMapData' in item) {
      // It's a Session
      return renderGridSession({ item: item as Session, index });
    } else if ('playlistName' in item && 'songs' in item) {
      // It's a Setlist (has playlistName and songs array)
      return renderGridSetlist({ item: item as Setlist, index });
    }
    return null;
  };

  const renderExplore = () => {
    // Distribute all items into 3 columns based on height (masonry layout)
    const heightVariations = [70, 140, 90, 160, 80, 130, 100, 150, 75, 145, 95, 125, 85, 135, 110, 155, 65, 120];
    const columns: (Setlist | Session | Sync)[][] = [[], [], []];
    const columnHeights = [0, 0, 0];
    
    exploreItems.forEach((item, index) => {
      let estimatedHeight = 100; // Base height for grid cards
      
      // Adjust height based on type
      if ('playlistName' in item) {
        // Setlist with cover image
        const coverHeight = heightVariations[index % heightVariations.length];
        estimatedHeight = coverHeight + 60;
      } else if ('heatMapData' in item) {
        // Session with mini heat map
        estimatedHeight = 140;
      } else if ('segments' in item) {
        // Sync with tempo bar chart
        estimatedHeight = 130;
      }
      
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[shortestColumnIndex].push(item);
      columnHeights[shortestColumnIndex] += estimatedHeight;
    });

    return (
      <View style={styles.sectionContent}>
        {/* AI Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="robot" size={20} color="#C4B5FD" style={{ marginRight: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search playlists, sessions, syncs... (e.g., 'running', 'hip-hop', 'fast tempo')"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              editable={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && (
            <Text style={styles.searchResultsText}>
              {exploreItems.length} {exploreItems.length === 1 ? 'result' : 'results'} found
            </Text>
          )}
        </View>

        {exploreItems.length > 0 ? (
          <ScrollView 
            style={styles.exploreContainer}
            contentContainerStyle={[styles.exploreContent, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            {/* All items in masonry grid */}
            <View style={styles.masonryColumns}>
              {columns.map((column, colIndex) => (
                <View key={colIndex} style={styles.masonryColumn}>
                  {column.map((item, itemIndex) => {
                    const globalIndex = exploreItems.indexOf(item);
                    return (
                      <View key={item.id} style={styles.masonryCardWrapper}>
                        {renderExploreItem({ item, index: globalIndex })}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.emptyState, { paddingBottom: 100 + insets.bottom }]}>
            <MaterialCommunityIcons 
              name={searchQuery.length > 0 ? "magnify" : "compass-outline"} 
              size={64} 
              color="rgba(255, 255, 255, 0.3)" 
            />
            <Text style={styles.emptyStateText}>
              {searchQuery.length > 0 ? 'No results found' : 'Nothing to explore'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery.length > 0 
                ? 'Try different keywords or search terms'
                : 'Discover new playlists, sessions, and syncs from other users'}
            </Text>
          </View>
        )}
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
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="music-note" size={20} color="#FFFFFF" style={[styles.titleIcon, { marginRight: 8 }]} />
              <Text style={styles.title}>Today's Mix</Text>
            </View>
          </View>

          {/* Section Tabs */}
          <View style={styles.sectionTabs}>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => setActiveTab('feed')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeTab === 'feed' && styles.sectionTabTextActive]}>
                Your Feed
              </Text>
              {activeTab === 'feed' && <View style={styles.sectionTabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => setActiveTab('explore')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeTab === 'explore' && styles.sectionTabTextActive]}>
                Explore
              </Text>
              {activeTab === 'explore' && <View style={styles.sectionTabUnderline} />}
            </TouchableOpacity>
          </View>

          {/* Section Content */}
          {activeTab === 'feed' ? (
            <FlatList
              data={mockFeedData}
              renderItem={renderFeedItem}
              keyExtractor={(item) => `${item.type}-${item.data.id}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: 52 + Math.max(20, insets.bottom) }]}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            renderExplore()
          )}
        </SafeAreaView>
        
        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(20, insets.bottom) }]}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, styles.navTextActive]}>Today's Mix</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Studio')}
          >
            <Text style={styles.navText}>Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('You')}
          >
            <Text style={styles.navText}>You</Text>
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
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 0,
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
    marginTop: 6,
    height: 2,
    width: '100%',
    backgroundColor: '#C4B5FD',
    borderRadius: 1,
  },
  sectionContent: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 100, // Will be updated dynamically with safe area
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100, // Will be updated dynamically
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchResultsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginLeft: 4,
  },
  exploreContainer: {
    flex: 1,
  },
  exploreContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 100, // Will be updated dynamically
  },
  exploreFeedSection: {
    marginBottom: 20,
  },
  exploreFeedItem: {
    marginBottom: 12,
  },
  masonryContainer: {
    flex: 1,
  },
  masonryContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100, // Will be updated dynamically
  },
  masonryColumns: {
    flexDirection: 'row',
  },
  masonryColumn: {
    flex: 1,
  },
  masonryCardWrapper: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  gridCard: {
    width: '100%',
  },
  gridCardGradient: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridCoverContainer: {
    width: '100%',
    position: 'relative',
  },
  gridCoverImage: {
    width: '100%',
    height: '100%',
  },
  gridCoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  gridCardContent: {
    padding: 6,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
    lineHeight: 16,
  },
  gridCardUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  gridAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  gridCardUserName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  miniHeatMapContainer: {
    marginVertical: 8,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniHeatMap: {
    flexDirection: 'column',
    height: 50,
    width: '100%',
  },
  miniHeatMapRow: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 1,
  },
  miniHeatMapCell: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  tempoBarChartContainer: {
    marginVertical: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  tempoBarChart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: '100%',
    paddingHorizontal: 4,
  },
  tempoBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
    height: 44,
    maxWidth: 20,
  },
  tempoBar: {
    width: 8,
    minHeight: 12,
    maxHeight: 44,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
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
});
