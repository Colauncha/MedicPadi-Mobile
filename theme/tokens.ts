/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const palette = {
  mono: {
    light: '#f4f4f7',
    lightGray: '#d1d1d6',
    gray: '#898990',
    darkGray: '#5c5c63',
    dark: '#1a1a1a',
  },
  // light
  light: {
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // custom
    background: '#fcfcfc',
    surface: '#f2f2f2',
    card: '#f7f7fb',
    cardLight: '#f3f4ff',
    cardBlue: '#e9eafe',
    text: {
      primary: '#121212',
      medium: '#464646',
      muted: '#b0b0b0',
    },
    buttonText: '#fcfcfc',
    border: '#c8c8c8',
    white: '#ffffff',
    gold: '#ffd888',
    primary: {
      shallow: '#e9eafe',
      base: '#d5d9ff',
      mid: '#6159f9',
      deep: '#2b1a98',
      extraDeep: '#140c5e',
    },
  },

  // dark
  dark: {
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // custom
    background: '#0F1014',
    card: '#171821',
    cardLight: '#1B1D2B',
    cardBlue: '#202342',
    text: {
      primary: '#F4F4F7',
      medium: '#B8BAC4',
      muted: '#777A87',
    },
    buttonText: '#fcfcfc',
    border: '#3f414d',
    white: '#FFFFFF',
    gold: '#FFD888',
    primary: {
      shallow: '#25284A',
      base: '#34386A',
      mid: '#7770FF',
      deep: '#817AFF',
      extraDeep: '#A29DFF',
    },
  },

  purple: {
    base: '#f1eff8',
    mid: '#d2cbe7',
    deep: '#b4a6d5',
    extraDeep: '#a08bc7',
  },

  green: '#47a052',
  successBg: '#E6F7EC',

  blue: {
    bg: '#d5d9ff',
    base: '#dbeafe',
    mid: '#60a5fa',
    deep: '#1e40af',
    extraDeep: '#172554',
  },

  warning: '#fa9e4d',
  warningBg: '#FFF3E0',

  danger: '#e5334b',
  dangerBg: '#FCE8EC',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const shadowsLight = {
  mild: '0px 2px 10px 0px rgba(100, 100, 100, 0.1)',
  base: '0px 2px 30px 0px rgba(100, 100, 100, 0.1)',
  heavy: '0px 2px 30px 0px rgba(50, 50, 50, 0.2)',
};

export const shadowsDark = {
  mild: '0px 2px 10px 0px rgba(120, 120, 120, 0.1)',
  base: '0px 2px 30px 0px rgba(120, 120, 120, 0.1)',
  heavy: '0px 2px 30px 0px rgba(152, 152, 151, 0.2)',
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const typography = {
  sizes: {
    xxs: 8,
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 20,
    xl: 24,
  },
  fonts: Platform.select({
    ios: {
      /** iOS `UIFontDescriptorSystemDesignDefault` */
      sans: 'system-ui',
      /** iOS `UIFontDescriptorSystemDesignSerif` */
      serif: 'ui-serif',
      /** iOS `UIFontDescriptorSystemDesignRounded` */
      rounded: 'ui-rounded',
      /** iOS `UIFontDescriptorSystemDesignMonospaced` */
      mono: 'ui-monospace',
    },
    android: {
      sans: 'normal',
      serif: 'serif',
      rounded: 'normal',
      mono: 'monospace',
    },
    // default: {
    //   sans: 'normal',
    //   serif: 'serif',
    //   rounded: 'normal',
    //   mono: 'monospace',
    // },
    web: {
      sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      serif: "Georgia, 'Times New Roman', serif",
      rounded:
        "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
      mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
  }),
};
