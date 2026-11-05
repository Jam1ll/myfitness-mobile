import { SUPPORTED_FONTS, type SupportedFontFamily, useSettingsStore } from '@/store/useSettingsStore';
import { useMemo } from 'react';
import type { TextStyle } from 'react-native';

export function getFontFamilyForStyle(
  family: SupportedFontFamily,
  fontWeight?: TextStyle['fontWeight'],
): string | undefined {
  const isBold =
    fontWeight === 'bold' ||
    fontWeight === '700' ||
    fontWeight === '800' ||
    fontWeight === '900' ||
    fontWeight === '600';

  switch (family) {
    case 'sans-serif':
      return isBold ? 'Inter_700Bold' : 'Inter_400Regular';
    case 'serif':
      return isBold ? 'Merriweather_700Bold' : 'Merriweather_400Regular';
    case 'monospace':
      return isBold ? 'SpaceMono_700Bold' : 'SpaceMono_400Regular';
    case 'system':
    default:
      return undefined;
  }
}

export function useTypography() {
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const setFontFamily = useSettingsStore((s) => s.setFontFamily);

  const fontInfo = useMemo(() => {
    return SUPPORTED_FONTS.find((f) => f.id === fontFamily) || SUPPORTED_FONTS[0];
  }, [fontFamily]);

  const getFont = (fontWeight?: TextStyle['fontWeight']) => {
    return getFontFamilyForStyle(fontFamily, fontWeight);
  };

  return {
    fontFamily,
    fontInfo,
    setFontFamily,
    availableFonts: SUPPORTED_FONTS,
    getFont,
  };
}

