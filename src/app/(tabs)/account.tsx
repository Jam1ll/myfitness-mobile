import { setAuthToken } from '@/api/axiosClient';
import AppText from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      t('account.logoutConfirmTitle'),
      t('account.logoutConfirmMessage'),
      [
        { text: t('account.cancel'), style: 'cancel' },
        {
          text: t('account.logout'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              // Clear Axios token and local storage
              await setAuthToken(null);

              if (Platform.OS === 'web') {
                localStorage.removeItem('user_token');
                localStorage.removeItem('user_name');
              } else {
                await SecureStore.deleteItemAsync('user_token');
                await SecureStore.deleteItemAsync('user_name');

                // Disconnect from Google SDK if initialized
                try {
                  await GoogleSignin.signOut();
                } catch (e) {
                  console.log(
                    'Could not sign out from Google SDK (it might not be initialized):',
                    e,
                  );
                }
              }

              // Redirect to login
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert(t('account.error'), t('account.logoutError'));
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  const handleOpenSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background, flex: 1 }}
      className="justify-between px-6 py-8"
      edges={['top', 'bottom']}
    >
      {/* ── Header & Profile Overview ────────────────────────────────────── */}
      <View>
        {/* Title */}
        <AppText
          weight="bold"
          style={{ color: colors.content.primary }}
          className="text-3xl font-extrabold mt-4"
        >
          {t('account.title')}
        </AppText>
        <AppText
          style={{ color: colors.content.secondary }}
          className="text-base mt-1"
        >
          {t('account.subtitle')}
        </AppText>

        {/* User Card */}
        <View
          style={{
            backgroundColor: colors.brand.surface,
            borderColor: colors.brand.surfaceBorder,
          }}
          className="mt-6 p-5 rounded-2xl border flex-row items-center"
        >
          <View
            style={{ backgroundColor: colors.brand.surfaceAlt }}
            className="w-14 h-14 rounded-full items-center justify-center mr-4"
          >
            <Ionicons name="person" size={26} color={colors.content.primary} />
          </View>
          <View className="flex-1">
            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-lg font-bold"
            >
              MyFitness User
            </AppText>
            <AppText
              style={{ color: colors.content.secondary }}
              className="text-xs mt-0.5"
            >
              Active Session
            </AppText>
          </View>
        </View>

        {/* Quick Settings Access Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenSettings}
          style={{
            backgroundColor: colors.brand.surface,
            borderColor: colors.brand.surfaceBorder,
          }}
          className="mt-4 p-4 rounded-2xl border flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View
              style={{ backgroundColor: colors.brand.surfaceAlt }}
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
            >
              <Ionicons name="options-outline" size={22} color={colors.status.info} />
            </View>
            <View className="flex-1">
              <AppText
                weight="bold"
                style={{ color: colors.content.primary }}
                className="text-base font-bold"
              >
                {t('account.settings')}
              </AppText>
              <AppText
                style={{ color: colors.content.secondary }}
                className="text-xs mt-0.5"
                numberOfLines={1}
              >
                {t('account.settingsDescription')}
              </AppText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.content.tertiary} />
        </TouchableOpacity>
      </View>

      {/* ── Action Buttons: Settings & Log Out ────────────────────────────── */}
      <View className="mb-4 gap-3">
        {/* Settings Button (Adjacent to Log Out) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenSettings}
          style={{
            backgroundColor: colors.brand.surface,
            borderColor: colors.brand.surfaceBorder,
          }}
          className="border rounded-2xl py-4 px-4 flex-row items-center justify-center shadow-sm"
        >
          <Ionicons name="settings-outline" size={20} color={colors.content.primary} />
          <AppText
            weight="bold"
            style={{ color: colors.content.primary }}
            className="text-base font-bold ml-2.5"
          >
            {t('account.settings')}
          </AppText>
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={{
            backgroundColor: colors.brand.surface,
            borderColor: colors.status.danger,
          }}
          className="border border-opacity-30 rounded-2xl py-4 px-4 flex-row items-center justify-center"
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.status.danger} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color={colors.status.danger} />
              <AppText
                weight="bold"
                style={{ color: colors.status.danger }}
                className="text-base font-bold ml-2.5"
              >
                {t('account.logout')}
              </AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
