import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

// Complete auth session for proper token handling
WebBrowser.maybeCompleteAuthSession();

const STRAVA_TOKEN_KEY = 'strava_access_token';

const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
};

export const connectStrava = async (): Promise<string | null> => {
  try {
    const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('Strava Client ID not found. Add EXPO_PUBLIC_STRAVA_CLIENT_ID to your .env file');
    }

    // Use Expo's proxy for Expo Go compatibility
    const redirectUri = AuthSession.makeRedirectUri({
      useProxy: true,
    });

    console.log('Strava Redirect URI:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['activity:read'],
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
      const clientSecret = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;
      
      if (!clientSecret) {
        throw new Error('Strava Client Secret not found. Add EXPO_PUBLIC_STRAVA_CLIENT_SECRET to your .env file');
      }

      const tokenResponse = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
        }).toString(),
      });

      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        await SecureStore.setItemAsync(STRAVA_TOKEN_KEY, tokenData.access_token);
        return tokenData.access_token;
      }
    }

    return null;
  } catch (error) {
    console.error('Strava connection error:', error);
    throw error;
  }
};

export const isStravaConnected = async (): Promise<boolean> => {
  try {
    const token = await SecureStore.getItemAsync(STRAVA_TOKEN_KEY);
    return token !== null && token !== undefined;
  } catch (error) {
    console.error('Error checking Strava connection:', error);
    return false;
  }
};

export const getStravaToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STRAVA_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const disconnectStrava = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STRAVA_TOKEN_KEY);
  } catch (error) {
    console.error('Strava disconnect error:', error);
  }
};
