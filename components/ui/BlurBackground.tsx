import { useTheme } from '@/theme/ThemeProvider';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet } from 'react-native';

export const BlurBackground = () => {
  const { theme } = useTheme();
  return (
    <BlurView
      intensity={60}
      tint={theme.mode === 'dark' ? 'dark' : 'light'}
      experimentalBlurMethod="dimezisBlurView"
      style={StyleSheet.absoluteFill}
    />
  );
};
