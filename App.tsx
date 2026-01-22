import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SavedItemsProvider } from './src/context/SavedItemsContext';
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
  ApiTest: undefined;
  SessionDetail: { session: Session };
  SetlistDetail: { setlist: Setlist };
  SyncDetail: { sync: Sync };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SavedItemsProvider>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </SavedItemsProvider>
  );
}
