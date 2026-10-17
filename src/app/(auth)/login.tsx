import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { axiosClient, setAuthToken } from '../../api/axiosClient';

export default function LoginScreen() {
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
      const firstName = response?.data?.user?.givenName || response?.data?.user?.name || 'Atleta';
      
      if (idToken) {
        if (Platform.OS === 'web') {
          localStorage.setItem('user_name', firstName);
        } else {
          await SecureStore.setItemAsync('user_name', firstName);
        }
        
        await verifyTokenWithBackend(idToken);
      } else {
        throw new Error("Failed to get Google token");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login already in progress');
      } else {
        console.error('Error de Google Sign-In:', error);
        Alert.alert('Error', 'Failed to login with Google.');
      }
    }
  };

  const verifyTokenWithBackend = async (googleToken: string) => {
    try {
      console.log("Sending token to backend...");
      
      const res = await axiosClient.post('/auth/google', { idToken: googleToken });
      const myFitnessJwt = res.data.token; 

      if (!myFitnessJwt) throw new Error("No se recibió token del backend");

      await setAuthToken(myFitnessJwt);
      
      console.log("Backend authenticated! JWT saved.");
      router.replace('/routines')
    } catch (error) {
      console.error("Error connecting to backend:", error);
      Alert.alert("Validation error", "Failed to connect to server.");
    }
  };

  return (
    <View className="flex-1 bg-black justify-center items-center px-8">
      <Text className="text-5xl font-bold text-white mb-4 tracking-widest">
        MyFitness
      </Text>
      <Text className="text-lg text-gray-400 mb-12 text-center">
        Give your best today.
      </Text>
      
      <TouchableOpacity
        onPress={signInWithGoogle}
        className="w-full py-4 bg-white rounded-xl flex-row justify-center items-center active:opacity-80"
      >
        <Text className="text-black text-lg font-semibold tracking-wide">
          Continue with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}