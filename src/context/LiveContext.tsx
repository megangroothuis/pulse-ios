import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Session as AuthSession } from '@supabase/supabase-js';
import {
  connectProvider,
  deleteAccount,
  ConnectOutcome,
  Connection,
  disconnectProvider,
  fetchConnections,
  fetchProfile,
  fetchSessions,
  Profile,
  Provider,
  syncNow,
} from '../lib/api';
import { getSupabase } from '../lib/supabase';
import { Session } from '../types';

export interface LiveState {
  authSession: AuthSession | null;
  authLoading: boolean;
  profile: Profile | null;
  sessions: Session[];
  connections: Connection[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  connect: (provider: Provider) => Promise<ConnectOutcome>;
  disconnect: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const LiveContext = createContext<LiveState | null>(null);

/** Live data, or null in demo mode (no Supabase configured). */
export const useLive = () => useContext(LiveContext);

export const LiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthSession(session));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = authSession?.user.id;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProfile();
      setProfile(p);
      const [s, c] = await Promise.all([p ? fetchSessions(p) : Promise.resolve([]), fetchConnections()]);
      setSessions(s);
      setConnections(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncNow();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setSessions([]);
      setConnections([]);
      return;
    }
    refresh();
  }, [userId, refresh]);

  const connect = useCallback(
    async (provider: Provider) => {
      const outcome = await connectProvider(provider);
      // The callback already kicked off a first sync; this picks up its results.
      if (outcome === 'connected') await sync();
      return outcome;
    },
    [sync],
  );

  const disconnect = useCallback(
    async (provider: Provider) => {
      await disconnectProvider(provider);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  return (
    <LiveContext.Provider
      value={{
        authSession,
        authLoading,
        profile,
        sessions,
        connections,
        loading,
        syncing,
        error,
        refresh,
        sync,
        connect,
        disconnect,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
};
