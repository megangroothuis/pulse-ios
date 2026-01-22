import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Setlist, Sync } from '../types';

// Simple in-memory storage for now (can be replaced with AsyncStorage later)
const storage = {
  setItem: async (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  getItem: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
};

interface SavedItemsContextType {
  savedSetlists: Setlist[];
  savedSyncs: Sync[];
  saveSetlist: (setlist: Setlist) => void;
  unsaveSetlist: (setlistId: string) => void;
  saveSync: (sync: Sync) => void;
  unsaveSync: (syncId: string) => void;
  isSetlistSaved: (setlistId: string) => boolean;
  isSyncSaved: (syncId: string) => boolean;
  getSetlistSaveCount: (setlistId: string, initialSaves?: number) => number;
  getSyncSaveCount: (syncId: string, initialSaves?: number) => number;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SETLISTS: '@pulse:saved_setlists',
  SYNCS: '@pulse:saved_syncs',
};

export const SavedItemsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedSetlists, setSavedSetlists] = useState<Setlist[]>([]);
  const [savedSyncs, setSavedSyncs] = useState<Sync[]>([]);
  // Track save counts for all items (in a real app, this would come from the backend)
  const [saveCounts, setSaveCounts] = useState<{ setlists: { [key: string]: number }; syncs: { [key: string]: number } }>({
    setlists: {},
    syncs: {},
  });

  // Load saved items from storage on mount
  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const setlistsJson = await storage.getItem(STORAGE_KEYS.SETLISTS);
      const syncsJson = await storage.getItem(STORAGE_KEYS.SYNCS);

      if (setlistsJson) {
        const setlists = JSON.parse(setlistsJson).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        }));
        setSavedSetlists(setlists);
      }

      if (syncsJson) {
        const syncs = JSON.parse(syncsJson).map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          segments: s.segments.map((seg: any) => ({
            ...seg,
            songs: seg.songs || [],
          })),
        }));
        setSavedSyncs(syncs);
      }
    } catch (error) {
      console.error('Error loading saved items:', error);
    }
  };

  const saveSetlist = async (setlist: Setlist) => {
    try {
      const updated = [...savedSetlists, setlist];
      setSavedSetlists(updated);
      await storage.setItem(STORAGE_KEYS.SETLISTS, JSON.stringify(updated));
      // Increment save count
      setSaveCounts(prev => ({
        ...prev,
        setlists: {
          ...prev.setlists,
          [setlist.id]: (prev.setlists[setlist.id] ?? setlist.saves ?? 0) + 1,
        },
      }));
    } catch (error) {
      console.error('Error saving setlist:', error);
    }
  };

  const unsaveSetlist = async (setlistId: string) => {
    try {
      const updated = savedSetlists.filter(s => s.id !== setlistId);
      setSavedSetlists(updated);
      await storage.setItem(STORAGE_KEYS.SETLISTS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error unsaving setlist:', error);
    }
  };

  const saveSync = async (sync: Sync) => {
    try {
      const updated = [...savedSyncs, sync];
      setSavedSyncs(updated);
      await storage.setItem(STORAGE_KEYS.SYNCS, JSON.stringify(updated));
      // Increment save count
      setSaveCounts(prev => ({
        ...prev,
        syncs: {
          ...prev.syncs,
          [sync.id]: (prev.syncs[sync.id] ?? sync.saves ?? 0) + 1,
        },
      }));
    } catch (error) {
      console.error('Error saving sync:', error);
    }
  };

  const unsaveSync = async (syncId: string) => {
    try {
      const updated = savedSyncs.filter(s => s.id !== syncId);
      setSavedSyncs(updated);
      await storage.setItem(STORAGE_KEYS.SYNCS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error unsaving sync:', error);
    }
  };

  const isSetlistSaved = (setlistId: string): boolean => {
    return savedSetlists.some(s => s.id === setlistId);
  };

  const isSyncSaved = (syncId: string): boolean => {
    return savedSyncs.some(s => s.id === syncId);
  };

  const getSetlistSaveCount = (setlistId: string, initialSaves?: number): number => {
    return saveCounts.setlists[setlistId] ?? initialSaves ?? 0;
  };

  const getSyncSaveCount = (syncId: string, initialSaves?: number): number => {
    return saveCounts.syncs[syncId] ?? initialSaves ?? 0;
  };

  return (
    <SavedItemsContext.Provider
      value={{
        savedSetlists,
        savedSyncs,
        saveSetlist,
        unsaveSetlist,
        saveSync,
        unsaveSync,
        isSetlistSaved,
        isSyncSaved,
        getSetlistSaveCount,
        getSyncSaveCount,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  if (context === undefined) {
    throw new Error('useSavedItems must be used within a SavedItemsProvider');
  }
  return context;
};
