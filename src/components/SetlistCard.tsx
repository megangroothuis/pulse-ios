import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Setlist } from '../types';
import { useSavedItems } from '../context/SavedItemsContext';

interface SetlistCardProps {
  setlist: Setlist;
  compact?: boolean;
}

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

export const SetlistCard: React.FC<SetlistCardProps> = ({ setlist, compact = false }) => {
  const navigation = useNavigation<NavigationProp>();
  const [isLiked, setIsLiked] = useState(setlist.isLiked);
  const [bumps, setBumps] = useState(setlist.bumps);
  const { isSetlistSaved, saveSetlist, unsaveSetlist, getSetlistSaveCount } = useSavedItems();
  const [isSaved, setIsSaved] = useState(() => isSetlistSaved(setlist.id));
  const [saveCount, setSaveCount] = useState(() => getSetlistSaveCount(setlist.id, setlist.saves));

  // Update saved state when context changes
  React.useEffect(() => {
    setIsSaved(isSetlistSaved(setlist.id));
    setSaveCount(getSetlistSaveCount(setlist.id, setlist.saves));
  }, [isSetlistSaved, getSetlistSaveCount, setlist.id, setlist.saves]);

  // Select cover image based on setlist ID for consistency
  const coverImage = useMemo(() => {
    if (defaultCoverImages.length > 0) {
      const index = parseInt(setlist.id) % defaultCoverImages.length;
      return defaultCoverImages[index];
    }
    return null;
  }, [setlist.id]);

  // Calculate average tempo
  const averageTempo = useMemo(() => {
    if (setlist.songs && setlist.songs.length > 0) {
      const sum = setlist.songs.reduce((acc, song) => acc + song.tempo, 0);
      return Math.round(sum / setlist.songs.length);
    }
    return 0;
  }, [setlist.songs]);

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
      setSaveCount(prev => Math.max(0, prev - 1));
    } else {
      saveSetlist(setlist);
      setIsSaved(true);
      setSaveCount(prev => prev + 1);
    }
  };

  const handlePress = () => {
    // Convert Date objects to ISO strings for serialization
    const serializedSetlist = {
      ...setlist,
      timestamp: setlist.timestamp.toISOString(),
    };
    navigation.navigate('SetlistDetail', { setlist: serializedSetlist });
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactCardContainer}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactCard}
        >
          {coverImage && (
            <View style={styles.compactCoverContainer}>
              <Image 
                source={coverImage} 
                style={styles.compactCoverImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          <View style={styles.compactContent}>
            <Text style={styles.compactPlaylistName}>{setlist.playlistName}</Text>
            <View style={styles.compactCreatorRow}>
              <MaterialCommunityIcons name="account" size={12} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.compactCreatorText}>by {setlist.userName}</Text>
            </View>
            <View style={styles.compactInfoRow}>
              <View style={styles.compactInfoBadge}>
                <MaterialCommunityIcons name="metronome" size={14} color="#C4B5FD" />
                <Text style={styles.compactInfoText}>{averageTempo} BPM</Text>
              </View>
              <View style={styles.compactInfoBadge}>
                <MaterialCommunityIcons name="music" size={14} color="#C4B5FD" />
                <Text style={styles.compactInfoText}>{setlist.songCount} songs</Text>
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
              <Text style={styles.avatarText}>{setlist.userName[0].toUpperCase()}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{setlist.userName}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(setlist.timestamp)}</Text>
            </View>
          </View>
          <View style={styles.typeBadge}>
            <MaterialCommunityIcons name="record-player" size={16} color="#C4B5FD" />
          </View>
        </View>

        <View>
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
          
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName}>{setlist.playlistName}</Text>
            <View style={styles.songCountBadge}>
              <Text style={styles.songCountText}>{setlist.songCount} songs</Text>
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
                color={isLiked ? "#C4B5FD" : "rgba(255, 255, 255, 0.6)"} 
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
                color={isSaved ? "#C4B5FD" : "rgba(255, 255, 255, 0.6)"} 
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
  compactCardContainer: {
    marginHorizontal: 20,
    marginVertical: 4,
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  typeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C4B5FD',
    letterSpacing: 0.3,
  },
  coverContainer: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
    marginBottom: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  playlistInfo: {
    marginTop: 4,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  songCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  songCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C4B5FD',
    letterSpacing: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
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
    color: '#A855F7',
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
    color: '#C4B5FD',
  },
  // Compact styles
  compactCard: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.3)',
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCoverContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  compactCoverImage: {
    width: '100%',
    height: '100%',
  },
  compactContent: {
    flex: 1,
    marginLeft: 4,
  },
  compactPlaylistName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
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
    alignItems: 'center',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  compactInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  compactInfoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C4B5FD',
    marginLeft: 6,
  },
});
