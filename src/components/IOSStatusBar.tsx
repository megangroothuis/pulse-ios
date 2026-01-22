import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * iOS Status Bar Component
 * Displays a mock iOS status bar with time, Wi-Fi, and battery icons
 * Sits fully inside the top safe area
 */
export const IOSStatusBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topInset = insets.top || 0;

  // Status bar content height is ~24px
  const statusBarContentHeight = 24;

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  // Calculate positioning - ensure status bar is always visible
  const containerHeight = Math.max(topInset + statusBarContentHeight, statusBarContentHeight + 20);
  const contentPaddingTop = Math.max(0, topInset - statusBarContentHeight);

  return (
    <View 
      style={[
        styles.container,
        { 
          paddingTop: contentPaddingTop,
          height: containerHeight,
        }
      ]}
    >
      <View style={styles.content}>
        {/* Time on the left */}
        <Text style={styles.time}>9:41</Text>
        
        {/* Right side icons */}
        <View style={styles.rightIcons}>
          {/* Wi-Fi icon */}
          <MaterialCommunityIcons 
            name="wifi" 
            size={14} 
            color="#FFFFFF" 
            style={styles.icon}
          />
          
          {/* Battery icon */}
          <MaterialCommunityIcons 
            name="battery" 
            size={16} 
            color="#FFFFFF" 
            style={[styles.icon, { marginLeft: 6 }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'transparent',
    pointerEvents: 'none',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 24,
    pointerEvents: 'none',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    opacity: 0.9,
  },
});
