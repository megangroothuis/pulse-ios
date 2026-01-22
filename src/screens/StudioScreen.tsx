import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { IOSStatusBar } from '../components/IOSStatusBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const StudioScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<'setlist' | 'session' | 'sync'>('setlist');
  
  // Workout builder state
  const [inputType, setInputType] = useState<'playlist' | 'genre'>('playlist');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [workoutTypeMode, setWorkoutTypeMode] = useState<'ai-pick' | 'specify'>('ai-pick');
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);

  // Sync builder state
  const [syncMusicType, setSyncMusicType] = useState<'playlist' | 'genre'>('playlist');
  const [syncSelectedPlaylist, setSyncSelectedPlaylist] = useState<string | null>(null);
  const [syncSelectedGenre, setSyncSelectedGenre] = useState<string | null>(null);
  const [syncWorkoutType, setSyncWorkoutType] = useState<string | null>(null);
  const [syncDuration, setSyncDuration] = useState<string | null>(null);
  const [syncIntensity, setSyncIntensity] = useState<string | null>(null);
  const [syncPlan, setSyncPlan] = useState<any>(null);

  const renderSetlist = () => (
    <ScrollView 
      style={styles.sectionContent}
      contentContainerStyle={[styles.labContent, { paddingBottom: 120 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.labHeader}>
        <MaterialCommunityIcons name="robot" size={48} color="#C4B5FD" />
        <Text style={styles.labTitle}>AI Playlist Builder</Text>
        <Text style={styles.labSubtitle}>
          Tell me about your workout and I'll create the perfect playlist for you
        </Text>
      </View>

      <View style={[styles.promptSection, { marginTop: 0, marginBottom: -30 }]}>
        <Text style={styles.promptLabel}>What kind of workout are you planning?</Text>
        <View style={styles.workoutTypeGrid}>
          {['Running', 'Cycling', 'Weightlifting', 'HIIT', 'Yoga', 'Rowing'].map((type) => (
            <TouchableOpacity key={type} style={styles.workoutTypeCard} activeOpacity={0.7}>
              <MaterialCommunityIcons 
                name={
                  type === 'Running' ? 'run' :
                  type === 'Cycling' ? 'bike' :
                  type === 'Weightlifting' ? 'dumbbell' :
                  type === 'HIIT' ? 'fire' :
                  type === 'Yoga' ? 'yoga' :
                  'rowing'
                }
                size={24}
                color="#C4B5FD"
              />
              <Text style={styles.workoutTypeText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.promptSection, { marginTop: -30 }]}>
        <Text style={styles.promptLabel}>Workout Duration</Text>
        <View style={styles.durationOptions}>
          {['15 min', '30 min', '45 min', '60 min', '90+ min'].map((duration) => (
            <TouchableOpacity key={duration} style={styles.durationButton} activeOpacity={0.7}>
              <Text style={styles.durationText}>{duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.promptSection}>
        <Text style={styles.promptLabel}>Intensity Level</Text>
        <View style={styles.intensityOptions}>
          {[
            { label: 'Light', icon: 'waves', color: '#60A5FA' },
            { label: 'Moderate', icon: 'trending-up', color: '#A78BFA' },
            { label: 'Intense', icon: 'fire', color: '#F87171' },
            { label: 'Extreme', icon: 'lightning-bolt', color: '#FB7185' },
          ].map((intensity) => (
            <TouchableOpacity key={intensity.label} style={styles.intensityCard} activeOpacity={0.7}>
              <MaterialCommunityIcons 
                name={intensity.icon as any}
                size={28}
                color={intensity.color}
              />
              <Text style={styles.intensityText}>{intensity.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.promptSection}>
        <Text style={styles.promptLabel}>Music Preferences</Text>
        <View style={styles.genreGrid}>
          {['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'R&B', 'Country', 'Latin', 'Jazz'].map((genre) => (
            <TouchableOpacity key={genre} style={styles.genreChip} activeOpacity={0.7}>
              <Text style={styles.genreText}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.generateButton} activeOpacity={0.8}>
        <LinearGradient
          colors={['#7C3AED', '#A78BFA', '#C4B5FD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.generateButtonGradient}
        >
          <MaterialCommunityIcons name="auto-fix" size={20} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Generate Playlist</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.labInfo}>
        <MaterialCommunityIcons name="information" size={20} color="rgba(255, 255, 255, 0.6)" />
        <Text style={styles.labInfoText}>
          Our AI analyzes your workout preferences and heart rate data to create personalized playlists
        </Text>
      </View>
    </ScrollView>
  );

  const renderSession = () => {
    // Mock playlists for selection
    const availablePlaylists = [
      'Morning Run Mix',
      'HIIT Power Hour',
      'Yoga Flow',
      'Cycling Beats',
      'Weightlifting Anthems',
    ];

    const genres = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'R&B', 'Country', 'Latin', 'Jazz'];

    const workoutTypes = [
      { name: 'Running', icon: 'run', color: '#60A5FA' },
      { name: 'Cycling', icon: 'bike', color: '#34D399' },
      { name: 'Weightlifting', icon: 'dumbbell', color: '#FBBF24' },
      { name: 'Free Weights', icon: 'weight-lifter', color: '#F87171' },
      { name: 'HIIT', icon: 'fire', color: '#FB7185' },
      { name: 'Yoga', icon: 'yoga', color: '#A78BFA' },
      { name: 'Rowing', icon: 'rowing', color: '#818CF8' },
    ];

    const generateWorkout = () => {
      // AI logic to generate workout based on music
      let avgTempo = 120;
      let energy = 70;
      let suggestedType = 'Running';
      let duration = '30 min';
      let intensity = 'Moderate';

      // If user specified a workout type, use it; otherwise let AI pick
      if (workoutTypeMode === 'specify' && selectedWorkoutType) {
        suggestedType = selectedWorkoutType;
        // Adjust duration and intensity based on specified type
        const typeConfig: { [key: string]: { duration: string; intensity: string; tempo: number; energy: number } } = {
          'Running': { duration: '45 min', intensity: 'Moderate', tempo: 145, energy: 85 },
          'Cycling': { duration: '60 min', intensity: 'Moderate', tempo: 130, energy: 80 },
          'Weightlifting': { duration: '45 min', intensity: 'Intense', tempo: 140, energy: 85 },
          'Free Weights': { duration: '45 min', intensity: 'Intense', tempo: 135, energy: 88 },
          'HIIT': { duration: '30 min', intensity: 'Extreme', tempo: 150, energy: 95 },
          'Yoga': { duration: '45 min', intensity: 'Light', tempo: 90, energy: 40 },
          'Rowing': { duration: '30 min', intensity: 'Intense', tempo: 140, energy: 85 },
        };
        const config = typeConfig[suggestedType] || typeConfig['Running'];
        duration = config.duration;
        intensity = config.intensity;
        avgTempo = config.tempo;
        energy = config.energy;
      } else {
        // AI picks based on music
        if (inputType === 'playlist' && selectedPlaylist) {
          // Analyze playlist characteristics
          if (selectedPlaylist.includes('HIIT') || selectedPlaylist.includes('Power')) {
            avgTempo = 150;
            energy = 95;
            suggestedType = 'HIIT';
            duration = '30 min';
            intensity = 'Extreme';
          } else if (selectedPlaylist.includes('Yoga') || selectedPlaylist.includes('Flow')) {
            avgTempo = 90;
            energy = 40;
            suggestedType = 'Yoga';
            duration = '45 min';
            intensity = 'Light';
          } else if (selectedPlaylist.includes('Cycling')) {
            avgTempo = 130;
            energy = 80;
            suggestedType = 'Cycling';
            duration = '60 min';
            intensity = 'Moderate';
          } else if (selectedPlaylist.includes('Weightlifting')) {
            avgTempo = 140;
            energy = 85;
            suggestedType = 'Weightlifting';
            duration = '45 min';
            intensity = 'Intense';
          } else if (selectedPlaylist.includes('Run')) {
            avgTempo = 145;
            energy = 85;
            suggestedType = 'Running';
            duration = '45 min';
            intensity = 'Moderate';
          }
        } else if (inputType === 'genre' && selectedGenre) {
          // Analyze genre characteristics
          const genreMap: { [key: string]: { tempo: number; energy: number; type: string; duration: string; intensity: string } } = {
            'Hip-Hop': { tempo: 150, energy: 90, type: 'HIIT', duration: '30 min', intensity: 'Intense' },
            'Electronic': { tempo: 140, energy: 88, type: 'Running', duration: '45 min', intensity: 'Moderate' },
            'Rock': { tempo: 135, energy: 85, type: 'Weightlifting', duration: '45 min', intensity: 'Intense' },
            'Pop': { tempo: 130, energy: 80, type: 'Running', duration: '30 min', intensity: 'Moderate' },
            'R&B': { tempo: 110, energy: 65, type: 'Cycling', duration: '45 min', intensity: 'Light' },
            'Jazz': { tempo: 100, energy: 45, type: 'Yoga', duration: '60 min', intensity: 'Light' },
            'Country': { tempo: 120, energy: 70, type: 'Cycling', duration: '45 min', intensity: 'Moderate' },
            'Latin': { tempo: 145, energy: 88, type: 'Running', duration: '30 min', intensity: 'Intense' },
          };

          const genreData = genreMap[selectedGenre] || { tempo: 120, energy: 70, type: 'Running', duration: '30 min', intensity: 'Moderate' };
          avgTempo = genreData.tempo;
          energy = genreData.energy;
          suggestedType = genreData.type;
          duration = genreData.duration;
          intensity = genreData.intensity;
        }
      }

      setWorkoutPlan({
        type: suggestedType,
        duration,
        intensity,
        avgTempo,
        energy,
        structure: generateWorkoutStructure(suggestedType, duration, intensity),
      });
    };

    const generateWorkoutStructure = (type: string, duration: string, intensity: string) => {
      const durationNum = parseInt(duration);
      const structures: { [key: string]: string[] } = {
        'Running': [
          `5 min warm-up (light jog)`,
          `${durationNum - 15} min main run (steady pace)`,
          `5 min cool-down (walk)`,
          `5 min stretching`,
        ],
        'HIIT': [
          `5 min warm-up`,
          `20 min intervals: 30s work / 30s rest`,
          `5 min cool-down`,
        ],
        'Cycling': [
          `5 min warm-up (easy pace)`,
          `${durationNum - 15} min main ride (moderate effort)`,
          `5 min cool-down`,
          `5 min stretching`,
        ],
        'Weightlifting': [
          `10 min warm-up`,
          `${durationNum - 20} min strength training`,
          `10 min cool-down & stretching`,
        ],
        'Free Weights': [
          `10 min warm-up`,
          `${durationNum - 20} min free weight exercises`,
          `10 min cool-down & stretching`,
        ],
        'Yoga': [
          `5 min centering & breathing`,
          `${durationNum - 10} min flow sequences`,
          `5 min savasana`,
        ],
      };

      return structures[type] || structures['Running'];
    };

    return (
      <ScrollView 
        style={styles.sectionContent}
        contentContainerStyle={[styles.labContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.labHeader}>
          <MaterialCommunityIcons name="robot" size={48} color="#EC4899" />
          <Text style={styles.labTitle}>AI Workout Builder</Text>
          <Text style={styles.labSubtitle}>
            Tell me about your music and I'll create the perfect workout for you
          </Text>
        </View>

        {/* Input Type Selection */}
        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Start with your music</Text>
          <View style={styles.inputTypeSelector}>
            <TouchableOpacity
              style={[styles.inputTypeButton, inputType === 'playlist' && styles.inputTypeButtonActive]}
              onPress={() => {
                setInputType('playlist');
                setSelectedPlaylist(null);
                setWorkoutPlan(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="playlist-music" 
                size={20} 
                color={inputType === 'playlist' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              />
              <Text style={[styles.inputTypeText, inputType === 'playlist' && styles.inputTypeTextActive]}>
                Playlist
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputTypeButton, inputType === 'genre' && styles.inputTypeButtonActive]}
              onPress={() => {
                setInputType('genre');
                setSelectedGenre(null);
                setWorkoutPlan(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="music-note" 
                size={20} 
                color={inputType === 'genre' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              />
              <Text style={[styles.inputTypeText, inputType === 'genre' && styles.inputTypeTextActive]}>
                Genre
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Selection */}
        {inputType === 'playlist' && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>Choose a playlist</Text>
            <View style={[styles.playlistGrid, styles.musicSelectionGrid]}>
              {availablePlaylists.map((playlist) => (
                <TouchableOpacity
                  key={playlist}
                  style={[
                    styles.playlistCard,
                    selectedPlaylist === playlist && styles.playlistCardActive
                  ]}
                  onPress={() => {
                    setSelectedPlaylist(playlist);
                    setWorkoutPlan(null);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name="playlist-music" 
                    size={24} 
                    color={selectedPlaylist === playlist ? '#EC4899' : 'rgba(255, 255, 255, 0.6)'} 
                  />
                  <Text style={[
                    styles.playlistText,
                    selectedPlaylist === playlist && styles.playlistTextActive
                  ]}>
                    {playlist}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Genre Selection */}
        {inputType === 'genre' && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>Choose a genre</Text>
            <View style={[styles.genreGrid, styles.musicSelectionGrid]}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    selectedGenre === genre && styles.genreChipActive
                  ]}
                  onPress={() => {
                    setSelectedGenre(genre);
                    setWorkoutPlan(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.genreText,
                    selectedGenre === genre && styles.genreTextActive
                  ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Workout Type Selection */}
        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Workout Type</Text>
          <View style={styles.workoutTypeModeSelector}>
            <TouchableOpacity
              style={[styles.workoutTypeModeButton, workoutTypeMode === 'ai-pick' && styles.workoutTypeModeButtonActive]}
              onPress={() => {
                setWorkoutTypeMode('ai-pick');
                setSelectedWorkoutType(null);
                setWorkoutPlan(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="robot" 
                size={18} 
                color={workoutTypeMode === 'ai-pick' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              />
              <Text style={[styles.workoutTypeModeText, workoutTypeMode === 'ai-pick' && styles.workoutTypeModeTextActive]}>
                AI Pick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.workoutTypeModeButton, workoutTypeMode === 'specify' && styles.workoutTypeModeButtonActive]}
              onPress={() => {
                setWorkoutTypeMode('specify');
                setWorkoutPlan(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="target" 
                size={18} 
                color={workoutTypeMode === 'specify' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              />
              <Text style={[styles.workoutTypeModeText, workoutTypeMode === 'specify' && styles.workoutTypeModeTextActive]}>
                Specify Type
              </Text>
            </TouchableOpacity>
          </View>

          {/* Workout Type Options (when specify mode is selected) */}
          {workoutTypeMode === 'specify' && (
            <View style={styles.workoutTypeGrid}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type.name}
                  style={[
                    styles.workoutTypeCard,
                    selectedWorkoutType === type.name && styles.workoutTypeCardActive
                  ]}
                  onPress={() => {
                    setSelectedWorkoutType(type.name);
                    setWorkoutPlan(null);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={type.icon as any}
                    size={24}
                    color={selectedWorkoutType === type.name ? type.color : 'rgba(255, 255, 255, 0.6)'}
                  />
                  <Text style={[
                    styles.workoutTypeText,
                    selectedWorkoutType === type.name && styles.workoutTypeTextActive
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!selectedPlaylist && !selectedGenre) && styles.generateButtonDisabled,
            (workoutTypeMode === 'specify' && !selectedWorkoutType) && styles.generateButtonDisabled
          ]}
          onPress={generateWorkout}
          activeOpacity={0.8}
          disabled={(!selectedPlaylist && !selectedGenre) || (workoutTypeMode === 'specify' && !selectedWorkoutType)}
        >
          <LinearGradient
            colors={['#EC4899', '#F472B6', '#F9A8D4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateButtonGradient}
          >
            <MaterialCommunityIcons name="auto-fix" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generate Workout</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Workout Plan Results */}
        {workoutPlan && (
          <View style={styles.workoutPlanContainer}>
            <View style={styles.workoutPlanHeader}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#EC4899" />
              <Text style={styles.workoutPlanTitle}>Your Workout Plan</Text>
            </View>

            <View style={styles.workoutPlanCard}>
              <View style={styles.workoutPlanRow}>
                <View style={styles.workoutPlanItem}>
                  <MaterialCommunityIcons name="run" size={20} color="#93C5FD" />
                  <Text style={styles.workoutPlanLabel}>Type</Text>
                  <Text style={styles.workoutPlanValue}>{workoutPlan.type}</Text>
                </View>
                <View style={styles.workoutPlanItem}>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="#93C5FD" />
                  <Text style={styles.workoutPlanLabel}>Duration</Text>
                  <Text style={styles.workoutPlanValue}>{workoutPlan.duration}</Text>
                </View>
                <View style={styles.workoutPlanItem}>
                  <MaterialCommunityIcons name="fire" size={20} color="#93C5FD" />
                  <Text style={styles.workoutPlanLabel}>Intensity</Text>
                  <Text style={styles.workoutPlanValue}>{workoutPlan.intensity}</Text>
                </View>
              </View>

              <View style={styles.workoutStructure}>
                <Text style={styles.workoutStructureTitle}>Workout Structure</Text>
                {workoutPlan.structure.map((step: string, index: number) => (
                  <View key={index} style={styles.workoutStep}>
                    <View style={styles.workoutStepNumber}>
                      <Text style={styles.workoutStepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.workoutStepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.musicStats}>
                <Text style={styles.musicStatsTitle}>Music Analysis</Text>
                <View style={styles.musicStatsRow}>
                  <View style={styles.musicStatItem}>
                    <Text style={styles.musicStatLabel}>Avg Tempo</Text>
                    <Text style={styles.musicStatValue}>{workoutPlan.avgTempo} BPM</Text>
                  </View>
                  <View style={styles.musicStatItem}>
                    <Text style={styles.musicStatLabel}>Energy</Text>
                    <Text style={styles.musicStatValue}>{workoutPlan.energy}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.labInfo}>
          <MaterialCommunityIcons name="information" size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.labInfoText}>
            Our AI analyzes your music's tempo, energy, and genre to recommend the perfect workout structure
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderSync = () => {
    // Mock playlists for selection
    const availablePlaylists = [
      'Morning Run Mix',
      'HIIT Power Hour',
      'Yoga Flow',
      'Cycling Beats',
      'Weightlifting Anthems',
    ];

    const genres = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'R&B', 'Country', 'Latin', 'Jazz'];
    const workoutTypes = [
      { name: 'Running', icon: 'run' },
      { name: 'Cycling', icon: 'bike' },
      { name: 'Weightlifting', icon: 'dumbbell' },
      { name: 'Free Weights', icon: 'weight-lifter' },
      { name: 'HIIT', icon: 'fire' },
      { name: 'Yoga', icon: 'yoga' },
      { name: 'Rowing', icon: 'rowing' },
    ];
    const durations = ['15 min', '30 min', '45 min', '60 min', '90+ min'];
    const intensities = [
      { label: 'Light', icon: 'waves', color: '#60A5FA' },
      { label: 'Moderate', icon: 'trending-up', color: '#A78BFA' },
      { label: 'Intense', icon: 'fire', color: '#F87171' },
      { label: 'Extreme', icon: 'lightning-bolt', color: '#FB7185' },
    ];

    const generateSyncWorkout = () => {
      // Get music characteristics
      let avgTempo = 120;
      let energy = 70;
      let playlistName = 'Your Playlist';

      if (syncMusicType === 'playlist' && syncSelectedPlaylist) {
        playlistName = syncSelectedPlaylist;
        // Analyze playlist characteristics
        if (syncSelectedPlaylist.includes('HIIT') || syncSelectedPlaylist.includes('Power')) {
          avgTempo = 150;
          energy = 95;
        } else if (syncSelectedPlaylist.includes('Yoga') || syncSelectedPlaylist.includes('Flow')) {
          avgTempo = 90;
          energy = 40;
        } else if (syncSelectedPlaylist.includes('Cycling')) {
          avgTempo = 130;
          energy = 80;
        } else if (syncSelectedPlaylist.includes('Weightlifting')) {
          avgTempo = 140;
          energy = 85;
        } else if (syncSelectedPlaylist.includes('Run')) {
          avgTempo = 145;
          energy = 85;
        }
      } else if (syncMusicType === 'genre' && syncSelectedGenre) {
        playlistName = `${syncSelectedGenre} Mix`;
        const genreMap: { [key: string]: { tempo: number; energy: number } } = {
          'Hip-Hop': { tempo: 150, energy: 90 },
          'Electronic': { tempo: 140, energy: 88 },
          'Rock': { tempo: 135, energy: 85 },
          'Pop': { tempo: 130, energy: 80 },
          'R&B': { tempo: 110, energy: 65 },
          'Jazz': { tempo: 100, energy: 45 },
          'Country': { tempo: 120, energy: 70 },
          'Latin': { tempo: 145, energy: 88 },
        };
        const genreData = genreMap[syncSelectedGenre] || { tempo: 120, energy: 70 };
        avgTempo = genreData.tempo;
        energy = genreData.energy;
      }

      // Generate synchronized workout structure
      const durationNum = syncDuration ? parseInt(syncDuration) : 30;
      const workoutType = syncWorkoutType || 'Running';
      const intensity = syncIntensity || 'Moderate';

      // Create playlist-synchronized workout phases
      const phases = generateSyncPhases(workoutType, durationNum, intensity, avgTempo, energy);

      setSyncPlan({
        playlistName,
        workoutType,
        duration: syncDuration || '30 min',
        intensity,
        avgTempo,
        energy,
        phases,
      });
    };

    const generateSyncPhases = (type: string, duration: number, intensity: string, tempo: number, energy: number) => {
      const phases: any[] = [];
      
      // Warm-up phase (first 10% of duration)
      const warmupDuration = Math.max(3, Math.round(duration * 0.1));
      phases.push({
        phase: 'Warm-up',
        duration: `${warmupDuration} min`,
        description: getWarmupDescription(type),
        tempo: Math.max(80, tempo - 30),
        energy: Math.max(30, energy - 30),
        songs: Math.ceil(warmupDuration / 3.5),
      });

      // Main workout phases based on playlist structure
      const mainDuration = duration - warmupDuration - Math.max(3, Math.round(duration * 0.1)); // minus cool-down
      const numPhases = intensity === 'Extreme' ? 4 : intensity === 'Intense' ? 3 : 2;
      const phaseDuration = Math.round(mainDuration / numPhases);

      for (let i = 0; i < numPhases; i++) {
        const phaseNames = ['Build', 'Peak', 'Sustain', 'Push'];
        const phaseName = phaseNames[i] || 'Main';
        const phaseTempo = tempo + (i * 5) - (numPhases - i) * 3;
        const phaseEnergy = Math.min(100, energy + (i * 5));
        
        phases.push({
          phase: phaseName,
          duration: `${phaseDuration} min`,
          description: getPhaseDescription(type, phaseName, intensity),
          tempo: Math.max(100, phaseTempo),
          energy: phaseEnergy,
          songs: Math.ceil(phaseDuration / 3.5),
        });
      }

      // Cool-down phase (last 10% of duration)
      const cooldownDuration = Math.max(3, Math.round(duration * 0.1));
      phases.push({
        phase: 'Cool-down',
        duration: `${cooldownDuration} min`,
        description: getCooldownDescription(type),
        tempo: Math.max(70, tempo - 40),
        energy: Math.max(20, energy - 50),
        songs: Math.ceil(cooldownDuration / 3.5),
      });

      return phases;
    };

    const getWarmupDescription = (type: string) => {
      const descriptions: { [key: string]: string } = {
        'Running': 'Light jog, dynamic stretches',
        'Cycling': 'Easy pace, gentle pedaling',
        'Weightlifting': 'Light weights, mobility work',
        'Free Weights': 'Light weights, form practice',
        'HIIT': 'Dynamic warm-up, activation',
        'Yoga': 'Centering, gentle flow',
        'Rowing': 'Easy pace, technique focus',
      };
      return descriptions[type] || 'Gentle warm-up';
    };

    const getPhaseDescription = (type: string, phase: string, intensity: string) => {
      if (phase === 'Build') {
        return `Gradually increase ${type.toLowerCase()} intensity`;
      } else if (phase === 'Peak') {
        return `Maximum effort ${type.toLowerCase()}`;
      } else if (phase === 'Sustain') {
        return `Maintain steady ${type.toLowerCase()} pace`;
      } else if (phase === 'Push') {
        return `Final push, high intensity ${type.toLowerCase()}`;
      }
      return `${type} at ${intensity.toLowerCase()} intensity`;
    };

    const getCooldownDescription = (type: string) => {
      const descriptions: { [key: string]: string } = {
        'Running': 'Slow walk, static stretches',
        'Cycling': 'Easy pedaling, stretches',
        'Weightlifting': 'Light stretching, recovery',
        'Free Weights': 'Stretching, mobility',
        'HIIT': 'Active recovery, stretches',
        'Yoga': 'Savasana, final relaxation',
        'Rowing': 'Easy pace, stretches',
      };
      return descriptions[type] || 'Cool-down and stretch';
    };

    return (
      <ScrollView 
        style={styles.sectionContent}
        contentContainerStyle={[styles.labContent, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.labHeader}>
          <MaterialCommunityIcons name="sync" size={48} color="#34D399" />
          <Text style={styles.labTitle}>Sync Workout Builder</Text>
          <Text style={styles.labSubtitle}>
            Combine your music and workout preferences to create a perfectly synchronized session
          </Text>
        </View>

        {/* Music Selection Section */}
        <View style={[styles.promptSection, { marginTop: 0 }]}>
          <Text style={styles.promptLabel}>Choose Your Music</Text>
          <View style={styles.inputTypeSelector}>
            <TouchableOpacity
              style={[styles.inputTypeButton, syncMusicType === 'playlist' && styles.syncInputTypeButtonActive]}
              onPress={() => {
                setSyncMusicType('playlist');
                setSyncSelectedPlaylist(null);
                setSyncSelectedGenre(null);
                setSyncPlan(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="playlist-music" 
                size={20} 
                color={syncMusicType === 'playlist' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              />
              <Text style={[styles.inputTypeText, syncMusicType === 'playlist' && styles.inputTypeTextActive]}>
                Playlist
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inputTypeButton, syncMusicType === 'genre' && styles.syncInputTypeButtonActive]}
              onPress={() => {
                setSyncMusicType('genre');
                setSyncSelectedPlaylist(null);
                setSyncSelectedGenre(null);
                setSyncPlan(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="music-note" 
                size={20} 
                color={syncMusicType === 'genre' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} 
              />
              <Text style={[styles.inputTypeText, syncMusicType === 'genre' && styles.inputTypeTextActive]}>
                Genre
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Selection */}
        {syncMusicType === 'playlist' && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>Choose a playlist</Text>
            <View style={[styles.playlistGrid, styles.musicSelectionGrid]}>
              {availablePlaylists.map((playlist) => (
                <TouchableOpacity
                  key={playlist}
                  style={[
                    styles.playlistCard,
                    syncSelectedPlaylist === playlist && styles.syncPlaylistCardActive
                  ]}
                  onPress={() => {
                    setSyncSelectedPlaylist(playlist);
                    setSyncPlan(null);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name="playlist-music" 
                    size={24} 
                    color={syncSelectedPlaylist === playlist ? '#34D399' : 'rgba(255, 255, 255, 0.6)'} 
                  />
                  <Text style={[
                    styles.playlistText,
                    syncSelectedPlaylist === playlist && styles.playlistTextActive
                  ]}>
                    {playlist}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Genre Selection */}
        {syncMusicType === 'genre' && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>Choose a genre</Text>
            <View style={[styles.genreGrid, styles.musicSelectionGrid]}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    syncSelectedGenre === genre && styles.syncGenreChipActive
                  ]}
                  onPress={() => {
                    setSyncSelectedGenre(genre);
                    setSyncPlan(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.genreText,
                    syncSelectedGenre === genre && styles.genreTextActive
                  ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Workout Selection Section */}
        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Workout Type</Text>
          <View style={styles.workoutTypeGrid}>
            {workoutTypes.map((type) => (
              <TouchableOpacity
                key={type.name}
                style={[
                  styles.workoutTypeCard,
                  syncWorkoutType === type.name && styles.syncWorkoutTypeCardActive
                ]}
                onPress={() => {
                  setSyncWorkoutType(type.name);
                  setSyncPlan(null);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name={type.icon as any}
                  size={24}
                  color={syncWorkoutType === type.name ? '#34D399' : 'rgba(255, 255, 255, 0.6)'}
                />
                <Text style={[
                  styles.workoutTypeText,
                  syncWorkoutType === type.name && styles.workoutTypeTextActive
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Duration</Text>
          <View style={styles.durationOptions}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.durationButton,
                  syncDuration === duration && styles.syncDurationButtonActive
                ]}
                onPress={() => {
                  setSyncDuration(duration);
                  setSyncPlan(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.durationText,
                  syncDuration === duration && styles.durationTextActive
                ]}>
                  {duration}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}>Intensity Level</Text>
          <View style={styles.intensityOptions}>
            {intensities.map((intensity) => (
              <TouchableOpacity
                key={intensity.label}
                style={[
                  styles.intensityCard,
                  syncIntensity === intensity.label && styles.syncIntensityCardActive
                ]}
                onPress={() => {
                  setSyncIntensity(intensity.label);
                  setSyncPlan(null);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name={intensity.icon as any}
                  size={28}
                  color={intensity.color}
                />
                <Text style={[
                  styles.intensityText,
                  syncIntensity === intensity.label && styles.intensityTextActive
                ]}>
                  {intensity.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!syncSelectedPlaylist && !syncSelectedGenre) && styles.generateButtonDisabled,
            !syncWorkoutType && styles.generateButtonDisabled,
            !syncDuration && styles.generateButtonDisabled,
            !syncIntensity && styles.generateButtonDisabled
          ]}
          onPress={generateSyncWorkout}
          activeOpacity={0.8}
          disabled={(!syncSelectedPlaylist && !syncSelectedGenre) || !syncWorkoutType || !syncDuration || !syncIntensity}
        >
          <LinearGradient
            colors={['#34D399', '#6EE7B7', '#A7F3D0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateButtonGradient}
          >
            <MaterialCommunityIcons name="sync" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Sync Workout & Playlist</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sync Plan Results */}
        {syncPlan && (
          <View style={styles.workoutPlanContainer}>
            <View style={styles.workoutPlanHeader}>
              <MaterialCommunityIcons name="sync" size={24} color="#34D399" />
              <Text style={styles.workoutPlanTitle}>Synchronized Workout Plan</Text>
            </View>

            <View style={styles.workoutPlanCard}>
              <View style={styles.syncPlanHeader}>
                <View>
                  <Text style={styles.syncPlaylistName}>{syncPlan.playlistName}</Text>
                  <Text style={styles.syncWorkoutType}>{syncPlan.workoutType} • {syncPlan.duration} • {syncPlan.intensity}</Text>
                </View>
              </View>

              <View style={styles.syncPhasesContainer}>
                {syncPlan.phases.map((phase: any, index: number) => (
                  <View key={index} style={styles.syncPhaseCard}>
                    <View style={styles.syncPhaseHeader}>
                      <View style={styles.syncPhaseNumber}>
                        <Text style={styles.syncPhaseNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.syncPhaseInfo}>
                        <Text style={styles.syncPhaseName}>{phase.phase}</Text>
                        <Text style={styles.syncPhaseDuration}>{phase.duration} • ~{phase.songs} songs</Text>
                      </View>
                      <View style={styles.syncPhaseStats}>
                        <View style={styles.syncPhaseStat}>
                          <MaterialCommunityIcons name="metronome" size={14} color="#34D399" />
                          <Text style={styles.syncPhaseStatText}>{phase.tempo} BPM</Text>
                        </View>
                        <View style={styles.syncPhaseStat}>
                          <MaterialCommunityIcons name="fire" size={14} color="#F87171" />
                          <Text style={styles.syncPhaseStatText}>{phase.energy}%</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.syncPhaseDescription}>{phase.description}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.musicStats}>
                <Text style={styles.musicStatsTitle}>Playlist Analysis</Text>
                <View style={styles.musicStatsRow}>
                  <View style={styles.musicStatItem}>
                    <Text style={styles.musicStatLabel}>Avg Tempo</Text>
                    <Text style={[styles.musicStatValue, { color: '#34D399' }]}>{syncPlan.avgTempo} BPM</Text>
                  </View>
                  <View style={styles.musicStatItem}>
                    <Text style={styles.musicStatLabel}>Energy</Text>
                    <Text style={[styles.musicStatValue, { color: '#34D399' }]}>{syncPlan.energy}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.labInfo}>
          <MaterialCommunityIcons name="information" size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.labInfoText}>
            Your workout phases are synchronized with your playlist's tempo and energy, creating a perfectly timed session
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Base gradient layer - matching MixdownScreen */}
      <LinearGradient
        colors={['#1E3A8A', '#312E81', '#4C1D95', '#6B21A8', '#7C3AED']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBase}
      />
      
      {/* Overlay gradient layer */}
      <LinearGradient
        colors={['rgba(139, 26, 139, 0.6)', 'rgba(160, 32, 240, 0.5)', 'rgba(220, 20, 60, 0.4)', 'rgba(233, 30, 99, 0.3)']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientOverlay}
      />
      
      {/* Top accent */}
      <LinearGradient
        colors={['rgba(139, 26, 139, 0.35)', 'rgba(160, 32, 240, 0.2)', 'rgba(160, 32, 240, 0.05)', 'transparent']}
        locations={[0, 0.25, 0.5, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.gradientAccent1}
      />
      
      {/* Middle accent */}
      <LinearGradient
        colors={['transparent', 'rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.25)', 'rgba(124, 58, 237, 0.15)', 'transparent']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientAccent2}
      />
      
      {/* Bottom accent */}
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
              <MaterialCommunityIcons name="music-box-multiple" size={20} color="#FFFFFF" style={styles.titleIcon} />
              <Text style={styles.title}>Studio</Text>
            </View>
          </View>

          {/* Section Tabs */}
          <View style={styles.sectionTabs}>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => setActiveSection('setlist')}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeSection === 'setlist' && styles.sectionTabTextActive]}>
                Setlist
              </Text>
              {activeSection === 'setlist' && <View style={styles.sectionTabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => {
                setActiveSection('session');
                // Reset workout builder state when switching to session tab
                setInputType('playlist');
                setSelectedPlaylist(null);
                setSelectedGenre(null);
                setWorkoutTypeMode('ai-pick');
                setSelectedWorkoutType(null);
                setWorkoutPlan(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeSection === 'session' && styles.sectionTabTextActive]}>
                Session
              </Text>
              {activeSection === 'session' && <View style={styles.sectionTabUnderline} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sectionTab}
              onPress={() => {
                setActiveSection('sync');
                // Reset sync builder state when switching to sync tab
                setSyncMusicType('playlist');
                setSyncSelectedPlaylist(null);
                setSyncSelectedGenre(null);
                setSyncWorkoutType(null);
                setSyncDuration(null);
                setSyncIntensity(null);
                setSyncPlan(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTabText, activeSection === 'sync' && styles.sectionTabTextActive]}>
                Sync
              </Text>
              {activeSection === 'sync' && <View style={styles.sectionTabUnderlineSync} />}
            </TouchableOpacity>
          </View>

          {/* Section Content */}
          {activeSection === 'setlist' ? renderSetlist() : activeSection === 'session' ? renderSession() : renderSync()}
        </SafeAreaView>
        
        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(20, insets.bottom) }]}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Mixdown')}
          >
            <Text style={styles.navText}>Today's Mix</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={[styles.navText, styles.navTextActive]}>Studio</Text>
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
  sectionTabUnderlineSync: {
    marginTop: 4,
    height: 2,
    width: '100%',
    backgroundColor: '#34D399',
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
  labContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  labHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  labTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  labSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  promptSection: {
    marginBottom: 8,
    marginTop: 0,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
    marginTop: 0,
  },
  workoutTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: -8,
    marginTop: 0,
  },
  workoutTypeCard: {
    width: '32%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    marginBottom: 8,
  },
  workoutTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: -8,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 2,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  intensityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: -8,
  },
  intensityCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    marginBottom: 8,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: -8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 2,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  generateButton: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  labInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  labInfoText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
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
  // Explore section styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
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
  masonryContainer: {
    flex: 1,
  },
  masonryContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 100,
  },
  masonryColumns: {
    flexDirection: 'row',
  },
  masonryColumn: {
    flex: 1,
  },
  masonryCardWrapper: {
    marginBottom: 4,
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
    minHeight: 28,
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
  // Workout Builder Styles
  inputTypeSelector: {
    flexDirection: 'row',
    marginBottom: 5,
    marginHorizontal: -4,
  },
  inputTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 2,
  },
  inputTypeButtonActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
  },
  inputTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  inputTypeTextActive: {
    color: '#FFFFFF',
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: -8,
  },
  playlistCard: {
    width: '46%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  playlistCardActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
  },
  playlistText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  playlistTextActive: {
    color: '#FFFFFF',
  },
  genreChipActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
  },
  genreTextActive: {
    color: '#FFFFFF',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  workoutPlanContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutPlanTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  workoutPlanCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  workoutPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  workoutPlanItem: {
    flex: 1,
    alignItems: 'center',
  },
  workoutPlanLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutPlanValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workoutStructure: {
    marginBottom: 20,
  },
  workoutStructureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  workoutStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 1,
    borderColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutStepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workoutStepText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  musicStats: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  musicStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  musicStatsRow: {
    flexDirection: 'row',
  },
  musicStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  musicStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  musicStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EC4899',
  },
  workoutTypeModeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  workoutTypeModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  workoutTypeModeButtonActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
  },
  workoutTypeModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  workoutTypeModeTextActive: {
    color: '#FFFFFF',
  },
  workoutTypeCardActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
    borderWidth: 2,
  },
  workoutTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Sync Builder Styles
  syncInputTypeButtonActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
  },
  syncPlaylistCardActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
  },
  syncGenreChipActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
  },
  syncWorkoutTypeCardActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
    borderWidth: 2,
  },
  syncDurationButtonActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
  },
  durationTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  syncIntensityCardActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
    borderWidth: 2,
  },
  intensityTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  syncPlanHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncPlaylistName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  syncWorkoutType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  syncPhasesContainer: {
    marginBottom: 20,
  },
  syncPhaseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  syncPhaseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  syncPhaseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncPhaseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  syncPhaseInfo: {
    flex: 1,
  },
  syncPhaseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  syncPhaseDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  syncPhaseStats: {
    flexDirection: 'row',
  },
  syncPhaseStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncPhaseStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  syncPhaseDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  musicSelectionGrid: {
    marginTop: 0,
    marginHorizontal: -4,
  },
});
