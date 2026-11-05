import { safeStorage } from './storage';
import type { ThemePreset } from '@/theme/themes';
import { I18nManager } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SupportedLanguage =
  | 'en'
  | 'es'
  | 'de'
  | 'fr'
  | 'ru'
  | 'ar'
  | 'zh'
  | 'ja';

export type SupportedFontFamily =
  | 'system'
  | 'sans-serif'
  | 'serif'
  | 'monospace';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  isRTL: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'zh', name: 'Mandarin Chinese', nativeName: '简体中文', isRTL: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', isRTL: false },
];

export interface FontInfo {
  id: SupportedFontFamily;
  name: string;
  category: string;
  regularFontName?: string;
  boldFontName?: string;
}

export const SUPPORTED_FONTS: FontInfo[] = [
  {
    id: 'system',
    name: 'System Default',
    category: 'System',
  },
  {
    id: 'sans-serif',
    name: 'Inter',
    category: 'Sans-Serif',
    regularFontName: 'Inter_400Regular',
    boldFontName: 'Inter_700Bold',
  },
  {
    id: 'serif',
    name: 'Merriweather',
    category: 'Serif',
    regularFontName: 'Merriweather_400Regular',
    boldFontName: 'Merriweather_700Bold',
  },
  {
    id: 'monospace',
    name: 'Space Mono',
    category: 'Monospace',
    regularFontName: 'SpaceMono_400Regular',
    boldFontName: 'SpaceMono_700Bold',
  },
];

export interface SettingsState {
  theme: ThemePreset;
  language: SupportedLanguage;
  fontFamily: SupportedFontFamily;

  setTheme: (theme: ThemePreset) => void;
  setLanguage: (language: SupportedLanguage) => void;
  setFontFamily: (fontFamily: SupportedFontFamily) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  theme: 'light' as ThemePreset,
  language: 'en' as SupportedLanguage,
  fontFamily: 'system' as SupportedFontFamily,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => {
        const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language);
        const shouldBeRTL = Boolean(langInfo?.isRTL);

        if (I18nManager.isRTL !== shouldBeRTL) {
          try {
            I18nManager.allowRTL(shouldBeRTL);
            I18nManager.forceRTL(shouldBeRTL);
          } catch {
            // Some platforms ignore dynamic RTL change without app reload
          }
        }

        set({ language });
      },

      setFontFamily: (fontFamily) => set({ fontFamily }),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'myfitness_user_settings',
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);

