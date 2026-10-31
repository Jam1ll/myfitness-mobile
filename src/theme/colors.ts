/**
 * Design-token constants for native props that don't accept Tailwind classes
 * (e.g. Ionicons `color`, ActivityIndicator `color`, Switch `trackColor`).
 *
 * These values MUST stay in sync with `tailwind.config.js → theme.extend.colors`.
 */

export const Colors = {
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
  },

  content: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    tertiary: '#6b7280',
    muted: '#71717a',
    disabled: '#52525b',
  },
} as const;
