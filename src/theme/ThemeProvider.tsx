import { THEMES, type ThemeColors, type ThemeDefinition, type ThemePreset } from './themes';
import { useSettingsStore } from '@/store/useSettingsStore';
import React, { createContext, useContext, useMemo } from 'react';

export interface ThemeContextValue {
  theme: ThemePreset;
  colors: ThemeColors;
  isDark: boolean;
  definition: ThemeDefinition;
  setTheme: (theme: ThemePreset) => void;
  availableThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const currentThemeId = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const definition = useMemo(() => {
    return THEMES[currentThemeId] || THEMES.light;
  }, [currentThemeId]);

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme: definition.id,
      colors: definition.colors,
      isDark: definition.isDark,
      definition,
      setTheme,
      availableThemes: Object.values(THEMES),
    };
  }, [definition, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback outside of provider
    const fallbackTheme = THEMES.light;
    return {
      theme: fallbackTheme.id,
      colors: fallbackTheme.colors,
      isDark: fallbackTheme.isDark,
      definition: fallbackTheme,
      setTheme: (theme: ThemePreset) => useSettingsStore.getState().setTheme(theme),
      availableThemes: Object.values(THEMES),
    };
  }
  return context;
}

