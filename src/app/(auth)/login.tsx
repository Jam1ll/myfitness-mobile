import { axiosClient, setAuthToken } from '../../api/axiosClient';
import AppText from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      offlineAccess: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const idToken = response?.data?.idToken;
      const firstName =
        response?.data?.user?.givenName || response?.data?.user?.name || 'Athlete';

      if (idToken) {
        if (Platform.OS === 'web') {
          localStorage.setItem('user_name', firstName);
        } else {
          await SecureStore.setItemAsync('user_name', firstName);
        }

        await verifyTokenWithBackend(idToken);
      } else {
        throw new Error('Failed to get Google token');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login already in progress');
      } else {
        console.error('Error de Google Sign-In:', error);
        Alert.alert(t('common.error'), t('auth.loginError'));
      }
    }
  };

  const verifyTokenWithBackend = async (googleToken: string) => {
    try {
      const res = await axiosClient.post('/auth/google', { idToken: googleToken });
      const myFitnessJwt = res.data.token;

      if (!myFitnessJwt) throw new Error('No token received from backend');

      await setAuthToken(myFitnessJwt);
      router.replace('/routines');
    } catch (error) {
      console.error('Error connecting to backend:', error);
      Alert.alert(t('common.error'), t('auth.serverError'));
    }
  };

  return (
    <View
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1 justify-center items-center px-8"
    >
      <AppText
        weight="bold"
        style={{ color: colors.brand.primary }}
        className="text-5xl font-black mb-4 tracking-widest"
      >
        MyFitness
      </AppText>
      <AppText
        style={{ color: colors.content.secondary }}
        className="text-lg mb-12 text-center"
      >
        {t('auth.subtitle')}
      </AppText>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={signInWithGoogle}
        style={{ backgroundColor: colors.brand.primary }}
        className="w-full py-4 rounded-xl flex-row justify-center items-center"
      >
        <AppText
          weight="bold"
          style={{ color: colors.brand.background }}
          className="text-lg font-bold tracking-wide"
        >
          {t('auth.continueWithGoogle')}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}
