// theme/dark.ts
import { palette, radius, shadowsDark, spacing, typography } from './tokens';
import { Theme } from './types';

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: palette.dark.background,
    surface: palette.dark.card,
    surfaceCard: palette.dark.card,
    surfaceCardLight: palette.dark.cardLight,
    surfaceCardBlue: palette.dark.cardBlue,
    text: palette.dark.text.primary,
    buttonText: palette.dark.buttonText,
    textSecondary: palette.dark.text.medium,
    textMuted: palette.dark.text.muted,
    primary: {
      shallow: palette.dark.primary.shallow,
      base: palette.dark.primary.base,
      mid: palette.dark.primary.mid,
      deep: palette.dark.primary.deep,
      extraDeep: palette.dark.primary.extraDeep,
    },
    border: palette.dark.border,
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
    mild: shadowsDark.mild,
    base: shadowsDark.base,
    heavy: shadowsDark.heavy,
  },
  spacing,
  radius,
  typography,
};
