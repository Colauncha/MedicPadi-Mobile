import { useTheme } from "@/theme/ThemeProvider";
import { Theme } from "@/theme/types";
import { useMemo } from "react";


export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [theme]);
}