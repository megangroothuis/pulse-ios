import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SavedItemsProvider } from './src/context/SavedItemsContext';
import { LiveProvider, useLive } from './src/context/LiveContext';
import { isLiveMode } from './src/lib/config';
import { SignInScreen } from './src/screens/SignInScreen';
import { MixdownScreen } from './src/screens/MixdownScreen';
import { StudioScreen } from './src/screens/StudioScreen';
import { YouScreen } from './src/screens/YouScreen';
import { SessionDetailScreen } from './src/screens/SessionDetailScreen';
import { SetlistDetailScreen } from './src/screens/SetlistDetailScreen';
import { SyncDetailScreen } from './src/screens/SyncDetailScreen';
import { Session, Setlist, Sync } from './src/types';

export type RootStackParamList = {
  Mixdown: undefined;
  Studio: undefined;
  You: undefined;
  SessionDetail: { session: Session };
  SetlistDetail: { setlist: Setlist };
  SyncDetail: { sync: Sync };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// On web, the Spotify/Strava OAuth flow runs in a popup that ends on this app's
// /connected URL; this hands the result back to the opener and closes it.
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const content = isLiveMode ? (
    <LiveProvider>
      <AuthGate />
    </LiveProvider>
  ) : (
    <AppNavigator />
  );
  return (
    <SavedItemsProvider>
      <SafeAreaProvider>{content}</SafeAreaProvider>
    </SavedItemsProvider>
  );
}

function AuthGate() {
  const live = useLive()!;
  if (live.authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#312E81', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }
  return live.authSession ? <AppNavigator /> : <SignInScreen />;
}

function AppNavigator() {
  return (
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
          initialRouteName="Mixdown"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right' as const,
            gestureEnabled: true,
            headerLargeTitle: false,
          }}
        >
          <Stack.Screen 
            name="Mixdown" 
            component={MixdownScreen}
            options={{
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="Studio" 
            component={StudioScreen}
            options={{
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="You" 
            component={YouScreen}
            options={{
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="SessionDetail" 
            component={SessionDetailScreen}
            options={{
              animation: 'slide_from_right',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="SetlistDetail" 
            component={SetlistDetailScreen}
            options={{
              animation: 'slide_from_right',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen 
            name="SyncDetail" 
            component={SyncDetailScreen}
            options={{
              animation: 'slide_from_right',
              headerLargeTitle: false,
            }}
          />
          </Stack.Navigator>
        </NavigationContainer>
  );
}
