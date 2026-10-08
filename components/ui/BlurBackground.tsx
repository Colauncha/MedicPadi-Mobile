import { useTheme } from '@/theme/ThemeProvider';
import { BlurView } from 'expo-blur';
import { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

interface BlurBackgroundProps {
  target?: RefObject<View | null>;
}

export const BlurBackground = ({ target }: BlurBackgroundProps) => {
  const { theme } = useTheme();
  return (
    <BlurView
      intensity={10}
      tint={theme.mode === 'dark' ? 'dark' : 'light'}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={[StyleSheet.absoluteFill, { opacity: 1 }]}
      blurTarget={target}
    />
  );
};
