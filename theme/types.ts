// theme/types.ts
export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceCard: string;
    surfaceCardLight: string;
    surfaceCardBlue: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    buttonText: string;
    primary: {
      shallow: string;
      mid: string;
      base: string;
      deep: string;
      extraDeep: string;
    };
    border: string;
    danger: string;
    success: string;
    warning: string;
    dangerBg: string;
    warningBg: string;
    successBg: string;
    purple: {
      base: string;
      mid: string;
      deep: string;
      extraDeep: string;
    };
    mono: {
      light: string;
      lightGray: string;
      gray: string;
      darkGray: string;
      dark: string;
    };
    blue: {
      bg: string;
      base: string;
      mid: string;
      deep: string;
      extraDeep: string;
    };
  };
  shadows: {
    mild: string;
    base: string;
    heavy: string;
  };
  spacing: typeof import('./tokens').spacing;
  radius: typeof import('./tokens').radius;
  typography: typeof import('./tokens').typography;
}
