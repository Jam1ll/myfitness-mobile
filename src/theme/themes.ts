export type ThemePreset =
  | 'light'
  | 'night'
  | 'high-contrast'
  | 'sunset'
  | 'cyberpunk'
  | 'ocean-breeze';

export interface ThemeColors {
  brand: {
    primary: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceBorder: string;
    borderMuted: string;
    muted: string;
  };
  status: {
    danger: string;
    dangerLight: string;
    info: string;
    infoLight: string;
    success: string;
    warning: string;
  };
  content: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    disabled: string;
  };
}

export interface ThemeDefinition {
  id: ThemePreset;
  nameKey: string;
  defaultName: string;
  isDark: boolean;
  colors: ThemeColors;
  previewColors: {
    background: string;
    surface: string;
    accent: string;
  };
}

export const THEMES: Record<ThemePreset, ThemeDefinition> = {
  light: {
    id: 'light',
    nameKey: 'settings.themes.light',
    defaultName: 'Light',
    isDark: false,
    previewColors: {
      background: '#f8fafc',
      surface: '#ffffff',
      accent: '#2563eb',
    },
    colors: {
      brand: {
        primary: '#0f172a',
        background: '#f8fafc',
        surface: '#ffffff',
        surfaceAlt: '#f1f5f9',
        surfaceBorder: '#e2e8f0',
        borderMuted: '#cbd5e1',
        muted: '#94a3b8',
      },
      status: {
        danger: '#dc2626',
        dangerLight: '#ef4444',
        info: '#2563eb',
        infoLight: '#3b82f6',
        success: '#16a34a',
        warning: '#d97706',
      },
      content: {
        primary: '#0f172a',
        secondary: '#475569',
        tertiary: '#64748b',
        muted: '#94a3b8',
        disabled: '#cbd5e1',
      },
    },
  },

  night: {
    id: 'night',
    nameKey: 'settings.themes.night',
    defaultName: 'Night',
    isDark: true,
    previewColors: {
      background: '#000000',
      surface: '#18181b',
      accent: '#3b82f6',
    },
    colors: {
      brand: {
        primary: '#ffffff',
        background: '#000000',
        surface: '#18181b',
        surfaceAlt: '#27272a',
        surfaceBorder: '#27272a',
        borderMuted: '#3f3f46',
        muted: '#52525b',
      },
      status: {
        danger: '#ef4444',
        dangerLight: '#f87171',
        info: '#3b82f6',
        infoLight: '#60a5fa',
        success: '#22c55e',
        warning: '#eab308',
      },
      content: {
        primary: '#ffffff',
        secondary: '#9ca3af',
        tertiary: '#6b7280',
        muted: '#71717a',
        disabled: '#52525b',
      },
    },
  },

  'high-contrast': {
    id: 'high-contrast',
    nameKey: 'settings.themes.highContrast',
    defaultName: 'High Contrast',
    isDark: true,
    previewColors: {
      background: '#000000',
      surface: '#121212',
      accent: '#ffffff',
    },
    colors: {
      brand: {
        primary: '#ffffff',
        background: '#000000',
        surface: '#0a0a0a',
        surfaceAlt: '#1a1a1a',
        surfaceBorder: '#ffffff',
        borderMuted: '#e5e5e5',
        muted: '#a3a3a3',
      },
      status: {
        danger: '#ff3333',
        dangerLight: '#ff6666',
        info: '#60a5fa',
        infoLight: '#93c5fd',
        success: '#33ff33',
        warning: '#ffff00',
      },
      content: {
        primary: '#ffffff',
        secondary: '#f5f5f5',
        tertiary: '#d4d4d4',
        muted: '#a3a3a3',
        disabled: '#737373',
      },
    },
  },

  sunset: {
    id: 'sunset',
    nameKey: 'settings.themes.sunset',
    defaultName: 'Sunset',
    isDark: true,
    previewColors: {
      background: '#1c1018',
      surface: '#2d1829',
      accent: '#f97316',
    },
    colors: {
      brand: {
        primary: '#ffedd5',
        background: '#1c1018',
        surface: '#2d1829',
        surfaceAlt: '#3d2138',
        surfaceBorder: '#4e2a48',
        borderMuted: '#6d3b66',
        muted: '#8a5082',
      },
      status: {
        danger: '#e11d48',
        dangerLight: '#f43f5e',
        info: '#f97316',
        infoLight: '#fb923c',
        success: '#10b981',
        warning: '#f59e0b',
      },
      content: {
        primary: '#fff1f2',
        secondary: '#fbcfe8',
        tertiary: '#d99bb8',
        muted: '#a76b88',
        disabled: '#6d3b66',
      },
    },
  },

  cyberpunk: {
    id: 'cyberpunk',
    nameKey: 'settings.themes.cyberpunk',
    defaultName: 'Cyberpunk',
    isDark: true,
    previewColors: {
      background: '#08080c',
      surface: '#10111a',
      accent: '#00f0ff',
    },
    colors: {
      brand: {
        primary: '#00f0ff',
        background: '#08080c',
        surface: '#10111a',
        surfaceAlt: '#181a28',
        surfaceBorder: '#242840',
        borderMuted: '#353a5c',
        muted: '#4a5180',
      },
      status: {
        danger: '#ff0055',
        dangerLight: '#ff4d88',
        info: '#00f0ff',
        infoLight: '#67f7ff',
        success: '#00ff66',
        warning: '#ffe600',
      },
      content: {
        primary: '#f0f6fc',
        secondary: '#00f0ff',
        tertiary: '#ffe600',
        muted: '#6871a4',
        disabled: '#414769',
      },
    },
  },

  'ocean-breeze': {
    id: 'ocean-breeze',
    nameKey: 'settings.themes.oceanBreeze',
    defaultName: 'Ocean Breeze',
    isDark: true,
    previewColors: {
      background: '#061523',
      surface: '#0c2338',
      accent: '#38bdf8',
    },
    colors: {
      brand: {
        primary: '#e0f2fe',
        background: '#061523',
        surface: '#0c2338',
        surfaceAlt: '#13324d',
        surfaceBorder: '#1b4366',
        borderMuted: '#255885',
        muted: '#3872a3',
      },
      status: {
        danger: '#f43f5e',
        dangerLight: '#fb7185',
        info: '#0284c7',
        infoLight: '#38bdf8',
        success: '#14b8a6',
        warning: '#f59e0b',
      },
      content: {
        primary: '#f0f9ff',
        secondary: '#7dd3fc',
        tertiary: '#38bdf8',
        muted: '#5289b5',
        disabled: '#2f5b82',
      },
    },
  },
};

