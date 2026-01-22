import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

// Complete auth session for proper token handling
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_TOKEN_KEY = 'spotify_access_token';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const connectSpotify = async (): Promise<string | null> => {
  try {
    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('Spotify Client ID not found. Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID to your .env file');
    }

    // Use Expo's proxy for Expo Go compatibility
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    console.log('Spotify Redirect URI:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['user-read-private', 'user-read-email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      extraParams: {},
    });

    const result = await request.promptAsync(discovery, {
      useProxy: true,
    });

    if (result.type === 'success') {
      const { code } = result.params;
      
      // Exchange code for token
      const tokenResponse = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || '',
        }).toString(),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        await SecureStore.setItemAsync(SPOTIFY_TOKEN_KEY, tokenData.access_token);
        return tokenData.access_token;
      }
    }

    return null;
  } catch (error) {
    console.error('Spotify connection error:', error);
    throw error;
  }
};

export const isSpotifyConnected = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(SPOTIFY_TOKEN_KEY);
    return token !== null && token !== undefined;
  } catch (error) {
    console.error('Error checking Spotify connection:', error);
    return false;
  }
};

export const getSpotifyToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(SPOTIFY_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const disconnectSpotify = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SPOTIFY_TOKEN_KEY);
  } catch (error) {
    console.error('Spotify disconnect error:', error);
  }
};
