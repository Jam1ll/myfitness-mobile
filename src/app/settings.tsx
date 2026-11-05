import AppText from '@/components/common/AppText';
import {
  SUPPORTED_FONTS,
  SUPPORTED_LANGUAGES,
  useSettingsStore
} from '@/store/useSettingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { THEMES } from '@/theme/themes';
import { useTypography } from '@/theme/typography';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, colors, setTheme, availableThemes } = useTheme();
  const currentLanguage = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { fontFamily, setFontFamily } = useTypography();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background, flex: 1 }}
      edges={['top', 'bottom']}
    >
      {/* ── Top App Bar ──────────────────────────────────────────────────── */}
      <View
        style={{
          borderBottomColor: colors.brand.surfaceBorder,
          backgroundColor: colors.brand.surface,
        }}
        className="px-5 py-3.5 border-b flex-row items-center justify-between"
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={{
            backgroundColor: colors.brand.surfaceAlt,
            borderColor: colors.brand.surfaceBorder,
          }}
          className="w-10 h-10 rounded-full items-center justify-center border"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.content.primary} />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-3">
          <AppText
            weight="bold"
            style={{ color: colors.content.primary }}
            className="text-lg font-bold"
          >
            {t('settings.title')}
          </AppText>
        </View>

        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
      >
        {/* ── Screen Intro ─────────────────────────────────────────────────── */}
        <View className="mb-6">
          <AppText
            weight="bold"
            style={{ color: colors.content.primary }}
            className="text-2xl font-black"
          >
            {t('settings.title')}
          </AppText>
          <AppText
            style={{ color: colors.content.secondary }}
            className="text-sm mt-1"
          >
            {t('settings.subtitle')}
          </AppText>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            SECTION 1: THEME & APPEARANCE
           ═════════════════════════════════════════════════════════════════════ */}
        <View className="mb-8">
          <View className="flex-row items-center mb-1">
            <Ionicons name="color-palette-outline" size={20} color={colors.status.info} />
            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-lg font-bold ml-2"
            >
              {t('settings.appearance')}
            </AppText>
          </View>
          <AppText
            style={{ color: colors.content.secondary }}
            className="text-xs mb-3.5"
          >
            {t('settings.themeDescription')}
          </AppText>

          {/* Theme Horizontal Card Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row -mx-5 px-5"
          >
            {availableThemes.map((item) => {
              const isSelected = theme === item.id;
              const localizedName = t(item.nameKey, { defaultValue: item.defaultName });

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => setTheme(item.id)}
                  style={{
                    backgroundColor: item.colors.brand.surface,
                    borderColor: isSelected
                      ? item.colors.status.info
                      : item.colors.brand.surfaceBorder,
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: isSelected ? item.colors.status.info : colors.brand.background,
                    shadowOpacity: isSelected ? 0.25 : 0.05,
                    shadowRadius: 8,
                  }}
                  className="w-36 p-3.5 rounded-2xl mr-3"
                >
                  {/* Swatches Row */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-1.5">
                      <View
                        style={{ backgroundColor: item.previewColors.background }}
                        className="w-5 h-5 rounded-full border border-white/20"
                      />
                      <View
                        style={{ backgroundColor: item.previewColors.surface }}
                        className="w-5 h-5 rounded-full border border-white/20"
                      />
                      <View
                        style={{ backgroundColor: item.previewColors.accent }}
                        className="w-5 h-5 rounded-full"
                      />
                    </View>

                    {isSelected && (
                      <View
                        style={{ backgroundColor: item.colors.status.info }}
                        className="w-5 h-5 rounded-full items-center justify-center"
                      >
                        <Ionicons name="checkmark" size={13} color={item.colors.brand.surface} />
                      </View>
                    )}
                  </View>

                  <AppText
                    weight="bold"
                    style={{ color: item.colors.content.primary }}
                    className="text-sm font-bold"
                  >
                    {localizedName}
                  </AppText>
                  <AppText
                    style={{ color: item.colors.content.secondary }}
                    className="text-[10px] mt-0.5"
                  >
                    {item.isDark}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            SECTION 2: LANGUAGE (i18n)
           ═════════════════════════════════════════════════════════════════════ */}
        <View className="mb-8">
          <View className="flex-row items-center mb-1">
            <Ionicons name="language-outline" size={20} color={colors.status.info} />
            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-lg font-bold ml-2"
            >
              {t('settings.language')}
            </AppText>
          </View>
          <AppText
            style={{ color: colors.content.secondary }}
            className="text-xs mb-3.5"
          >
            {t('settings.languageDescription')}
          </AppText>

          <View
            style={{
              backgroundColor: colors.brand.surface,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="rounded-2xl border overflow-hidden"
          >
            {SUPPORTED_LANGUAGES.map((lang, index) => {
              const isSelected = currentLanguage === lang.code;
              const isLast = index === SUPPORTED_LANGUAGES.length - 1;

              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.7}
                  onPress={() => setLanguage(lang.code)}
                  style={{
                    backgroundColor: isSelected
                      ? colors.brand.surfaceAlt
                      : colors.brand.surface,
                    borderBottomColor: colors.brand.surfaceBorder,
                    borderBottomWidth: isLast ? 0 : 1,
                  }}
                  className="px-4 py-3.5 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      style={{
                        backgroundColor: isSelected
                          ? colors.status.info
                          : colors.brand.surfaceAlt,
                      }}
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    >
                      <AppText
                        weight="bold"
                        style={{
                          color: isSelected ? colors.content.primary : colors.content.secondary,
                          fontSize: 11,
                        }}
                        className="font-bold uppercase"
                      >
                        {lang.code}
                      </AppText>
                    </View>

                    <View>
                      <AppText
                        weight="bold"
                        style={{ color: colors.content.primary }}
                        className="text-sm font-bold"
                      >
                        {lang.nativeName}
                      </AppText>
                      <AppText
                        style={{ color: colors.content.secondary }}
                        className="text-xs"
                      >
                        {lang.name} {lang.isRTL ? '• RTL' : ''}
                      </AppText>
                    </View>
                  </View>

                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.status.info}
                    />
                  ) : (
                    <View
                      style={{ borderColor: colors.brand.borderMuted }}
                      className="w-5 h-5 rounded-full border"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            SECTION 3: TYPOGRAPHY CUSTOMIZATION
           ═════════════════════════════════════════════════════════════════════ */}
        <View className="mb-8">
          <View className="flex-row items-center mb-1">
            <Ionicons name="text-outline" size={20} color={colors.status.info} />
            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-lg font-bold ml-2"
            >
              {t('settings.typography')}
            </AppText>
          </View>
          <AppText
            style={{ color: colors.content.secondary }}
            className="text-xs mb-3.5"
          >
            {t('settings.fontDescription')}
          </AppText>

          <View className="gap-2.5">
            {SUPPORTED_FONTS.map((font) => {
              const isSelected = fontFamily === font.id;

              return (
                <TouchableOpacity
                  key={font.id}
                  activeOpacity={0.8}
                  onPress={() => setFontFamily(font.id)}
                  style={{
                    backgroundColor: colors.brand.surface,
                    borderColor: isSelected
                      ? colors.status.info
                      : colors.brand.surfaceBorder,
                    borderWidth: isSelected ? 2 : 1,
                  }}
                  className="p-4 rounded-2xl flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center">
                      <AppText
                        weight="bold"
                        style={{
                          color: colors.content.primary,
                          fontFamily: font.regularFontName,
                        }}
                        className="text-base font-bold"
                      >
                        {font.name}
                      </AppText>
                      <View
                        style={{ backgroundColor: colors.brand.surfaceAlt }}
                        className="ml-2.5 px-2 py-0.5 rounded-full"
                      >
                        <AppText
                          style={{ color: colors.content.secondary, fontSize: 10 }}
                          className="font-semibold uppercase"
                        >
                          {font.category}
                        </AppText>
                      </View>
                    </View>

                    <AppText
                      style={{
                        color: colors.content.secondary,
                        fontFamily: font.regularFontName,
                      }}
                      className="text-xs mt-1"
                    >
                      Aa Bb Cc 123 • The quick brown fox jumps
                    </AppText>
                  </View>

                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.status.info}
                    />
                  ) : (
                    <View
                      style={{ borderColor: colors.brand.borderMuted }}
                      className="w-5 h-5 rounded-full border"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            SECTION 4: LIVE PREVIEW & FEEDBACK CARD
           ═════════════════════════════════════════════════════════════════════ */}
        <View className="mb-6">
          <View className="flex-row items-center mb-1">
            <Ionicons name="eye-outline" size={20} color={colors.status.info} />
            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-lg font-bold ml-2"
            >
              {t('settings.preview')}
            </AppText>
          </View>

          <View
            style={{
              backgroundColor: colors.brand.surface,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="p-5 rounded-2xl border shadow-md mt-2"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <View
                  style={{ backgroundColor: colors.status.info }}
                  className="w-2.5 h-2.5 rounded-full"
                />
                <AppText
                  weight="bold"
                  style={{ color: colors.content.primary }}
                  className="text-sm font-bold uppercase tracking-wider"
                >
                  MyFitness Preview
                </AppText>
              </View>

              <View
                style={{ backgroundColor: colors.status.success + '20' }}
                className="px-2.5 py-1 rounded-full flex-row items-center"
              >
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={colors.status.success}
                />
                <AppText
                  style={{ color: colors.status.success, fontSize: 10 }}
                  className="font-bold ml-1"
                >
                  {t('settings.saved')}
                </AppText>
              </View>
            </View>

            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-xl font-black mb-1.5"
            >
              Focus & Consistency
            </AppText>

            <AppText
              style={{ color: colors.content.secondary, lineHeight: 22 }}
              className="text-sm"
            >
              {t('settings.previewText')}
            </AppText>

            {/* Badges for active settings */}
            <View className="flex-row flex-wrap gap-2 mt-4 pt-3 border-t border-brand-surfaceBorder">
              <View
                style={{ backgroundColor: colors.brand.surfaceAlt }}
                className="px-2.5 py-1 rounded-lg"
              >
                <AppText
                  style={{ color: colors.content.secondary, fontSize: 11 }}
                  className="font-semibold"
                >
                  Theme: {THEMES[theme]?.defaultName}
                </AppText>
              </View>

              <View
                style={{ backgroundColor: colors.brand.surfaceAlt }}
                className="px-2.5 py-1 rounded-lg"
              >
                <AppText
                  style={{ color: colors.content.secondary, fontSize: 11 }}
                  className="font-semibold"
                >
                  Lang: {currentLanguage.toUpperCase()}
                </AppText>
              </View>

              <View
                style={{ backgroundColor: colors.brand.surfaceAlt }}
                className="px-2.5 py-1 rounded-lg"
              >
                <AppText
                  style={{ color: colors.content.secondary, fontSize: 11 }}
                  className="font-semibold"
                >
                  Font:{' '}
                  {SUPPORTED_FONTS.find((f) => f.id === fontFamily)?.name}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

