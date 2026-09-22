// theme/light.ts
import { palette, radius, shadowsLight, spacing, typography } from './tokens';
import { Theme } from './types';

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: palette.light.background,
    surface: palette.light.surface,
    surfaceCard: palette.light.card,
    surfaceCardLight: palette.light.cardLight,
    surfaceCardBlue: palette.blue.deep,
    text: palette.light.text.primary,
    buttonText: palette.light.buttonText,
    textSecondary: palette.light.text.medium,
    textMuted: palette.light.text.muted,
    primary: {
      shallow: palette.light.primary.shallow,
      base: palette.light.primary.base,
      mid: palette.light.primary.mid,
      deep: palette.light.primary.deep,
      extraDeep: palette.light.primary.extraDeep,
    },
    border: palette.light.border,
    danger: palette.danger,
    success: palette.green,
    warning: palette.warning,
    dangerBg: palette.dangerBg,
    successBg: palette.successBg,
    warningBg: palette.warningBg,
    purple: {
      base: palette.purple.base,
      mid: palette.purple.mid,
      deep: palette.purple.deep,
      extraDeep: palette.purple.extraDeep,
    },
    mono: {
      light: palette.mono.light,
      lightGray: palette.mono.lightGray,
      gray: palette.mono.gray,
      darkGray: palette.mono.darkGray,
      dark: palette.mono.dark,
    },
    blue: {
      bg: palette.blue.bg,
      base: palette.blue.base,
      mid: palette.blue.mid,
      deep: palette.blue.deep,
      extraDeep: palette.blue.extraDeep,
    },
  },
  shadows: {
    mild: shadowsLight.mild,
    base: shadowsLight.base,
    heavy: shadowsLight.heavy,
  },
  spacing,
  radius,
  typography,
};
