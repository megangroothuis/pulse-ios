import { Platform } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { saveConnectedAccount } from './db';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete auth session for OAuth flows (only on native)
if (Platform.OS !== 'web' && WebBrowser?.maybeCompleteAuthSession) {
  WebBrowser.maybeCompleteAuthSession();
}

// Spotify OAuth connection hook
export const useSpotifyOAuth = (userId: string | null) => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_spotify' });

  const connectSpotify = async () => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      if (!AuthSession) {
        throw new Error('OAuth is not available on this platform');
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'pulse',
        path: 'oauth-callback',
      });

      const { createdSessionId, setActive, signIn } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        
        // Save connection to Supabase
        // Note: In production, you'd want to get the actual OAuth token from Clerk webhook
        // For now, we'll save a placeholder - you'll need to implement webhook or API to get tokens
        await saveConnectedAccount(
          userId,
          'spotify',
          null, // provider_account_id - would come from Clerk webhook
          null, // access_token - would come from Clerk webhook
          null, // refresh_token - would come from Clerk webhook
          null  // expires_at - would come from Clerk webhook
        );

        return { success: true };
      } else {
        // Handle sign-in flow if needed
        if (signIn) {
          await signIn.setActive({ session: signIn.createdSessionId });
        }
        return { success: false, message: 'OAuth flow incomplete' };
      }
    } catch (err: any) {
      console.error('Spotify OAuth error:', err);
      throw err;
    }
  };

  return { connectSpotify };
};

// Strava OAuth connection hook
export const useStravaOAuth = (userId: string | null) => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_strava' });

  const connectStrava = async () => {
    if (!userId) {
      throw new Error('User must be authenticated');
    }

    try {
      if (!AuthSession) {
        throw new Error('OAuth is not available on this platform');
      }

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'pulse',
        path: 'oauth-callback',
      });

      const { createdSessionId, setActive, signIn } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        
        // Save connection to Supabase
        // Note: In production, get actual tokens from Clerk webhook
        await saveConnectedAccount(
          userId,
          'strava',
          null, // provider_account_id
          null, // access_token
          null, // refresh_token
          null  // expires_at
        );

        return { success: true };
      } else {
        if (signIn) {
          await signIn.setActive({ session: signIn.createdSessionId });
        }
        return { success: false, message: 'OAuth flow incomplete' };
      }
    } catch (err: any) {
      console.error('Strava OAuth error:', err);
      throw err;
    }
  };

  return { connectStrava };
};
