import ar from './locales/ar.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import { useSettingsStore } from '@/store/useSettingsStore';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

export const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  ru: { translation: ru },
  ar: { translation: ar },
  zh: { translation: zh },
  ja: { translation: ja },
} as const;

export type TranslationResources = typeof resources;

// Detect device language with fallback
export function getInitialLanguage(): string {
  try {
    const saved = useSettingsStore.getState().language;
    if (saved && Object.keys(resources).includes(saved)) {
      return saved;
    }

    const deviceLocales = Localization.getLocales();
    const deviceLang = deviceLocales[0]?.languageCode;
    if (deviceLang && Object.keys(resources).includes(deviceLang)) {
      return deviceLang;
    }
  } catch {
    // Fallback
  }
  return 'en';
}

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safe from XSS
  },
});

// Sync store language changes with i18next & RTL
useSettingsStore.subscribe((state, prevState) => {
  if (state.language !== prevState.language) {
    i18n.changeLanguage(state.language);

    const isRTL = state.language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      try {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      } catch {
        // Ignored
      }
    }
  }
});

export default i18n;

