import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { createOrUpdateUser, getUserByClerkId, markOnboardingComplete } from '../lib/db';

const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk publishable key. Check your .env file or app.json configuration.');
}

interface AuthContextType {
  isSignedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  clerkUserId: string | null;
  onboardingCompleted: boolean | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inner provider that uses Clerk hooks
const AuthProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSignedIn, userId: clerkUserId } = useAuth();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const syncUserToSupabase = async () => {
    if (!isSignedIn || !clerkUserId || !user) {
      setUserId(null);
      setOnboardingCompleted(null);
      setIsLoading(false);
      return;
    }

    try {
      // Get phone number from Clerk user
      const phoneNumber = user.primaryPhoneNumber?.phoneNumber || null;

      // Create or update user in Supabase
      const supabaseUser = await createOrUpdateUser(clerkUserId, phoneNumber);
      setUserId(supabaseUser.id);
      setOnboardingCompleted(supabaseUser.onboarding_completed);
    } catch (error) {
      console.error('Error syncing user to Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    await syncUserToSupabase();
  };

  useEffect(() => {
    syncUserToSupabase();
  }, [isSignedIn, clerkUserId, user?.primaryPhoneNumber?.phoneNumber]);

  // Listen for onboarding completion
  useEffect(() => {
    if (userId && onboardingCompleted === false) {
      // Check if onboarding was completed elsewhere
      const checkOnboarding = async () => {
        try {
          const userData = await getUserByClerkId(clerkUserId!);
          if (userData?.onboarding_completed) {
            setOnboardingCompleted(true);
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      };
      checkOnboarding();
    }
  }, [userId, onboardingCompleted, clerkUserId]);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: isSignedIn || false,
        isLoading,
        userId,
        clerkUserId,
        onboardingCompleted,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Outer provider that wraps with ClerkProvider
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </ClerkProvider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
