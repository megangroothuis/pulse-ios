export interface HeatMapDataPoint {
  songBPM: number;
  heartRate: number;
  durationMinutes: number;
  songName: string;
  // Present on real (synced) sessions; mock data relies on name lookups instead.
  artist?: string;
  genre?: string;
  energy?: number | null;
  offsetSeconds?: number;
}

export interface Song {
  name: string;
  tempo: number; // BPM
  energy: number; // 1-100
}

export interface GenreBadge {
  type: 'fastest-pace' | 'recovery-beats' | 'peak-intensity' | 'steady-rhythm' | 'power-boost';
  label: string;
}

export interface GenreData {
  name: string;
  durationMinutes: number;
  badges: GenreBadge[];
  avgHeartRate?: number;
  avgBPM?: number;
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  workoutType: string;
  title?: string;
  description?: string;
  artists: string[];
  songs: string[];
  powerSong: string;
  peakHeartRate: number;
  timestamp: Date;
  heatMapData: HeatMapDataPoint[];
  genres?: GenreData[];
  bumps: number;
  isLiked: boolean;
  avgHeartRate?: number;
  musicMinutes?: number;
}

export interface Setlist {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  playlistName: string;
  description?: string;
  coverImage?: string;
  songCount: number;
  songs: Song[];
  timestamp: Date;
  bumps: number;
  isLiked: boolean;
  saves: number;
}

export interface SyncSegment {
  id: string;
  phase: string; // e.g., "Warm-up", "Build", "Peak", "Cool-down"
  workoutInstruction: string; // e.g., "warm up cycle", "push pace", "hill"
  musicInstruction: string; // e.g., "to these three songs", "to the chorus of this song", "for the next song"
  description: string; // Full description combining workout and music
  duration: string; // e.g., "5 min"
  songs?: Song[]; // Specific songs for this segment
  songPart?: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'full'; // If targeting a specific part
  tempo: number; // BPM
  energy: number; // 1-100
}

export interface Sync {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  workoutType: string;
  duration: string; // e.g., "30 min"
  intensity: string; // e.g., "Moderate", "Intense"
  playlistName?: string;
  playlistId?: string;
  segments: SyncSegment[];
  avgTempo: number;
  avgEnergy: number;
  timestamp: Date;
  bumps: number;
  isLiked: boolean;
  saves: number;
}

export type FeedItem = 
  | { type: 'session'; data: Session }
  | { type: 'setlist'; data: Setlist }
  | { type: 'sync'; data: Sync };

export interface ConnectedAccount {
  id: string;
  name: string;
  type: 'music' | 'fitness';
  icon: string;
  connected: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar?: string | number; // string for URL, number for require() local image
  followers: number;
  following: number;
  totalSyncs: number;
  sessionsCreated: number;
  setlistsCreated: number;
  sessionsRecorded: number;
  connectedAccounts: ConnectedAccount[];
}
