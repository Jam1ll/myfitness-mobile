import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { axiosClient } from '../../api/axiosClient';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginScreen() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken, 
      redirectUri: AuthSession.makeRedirectUri(),
      usePKCE: false,
      extraParams: {
        nonce: 'myfitness_nonce_secure', 
      },
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      verifyTokenWithBackend(idToken);
    } else if (response?.type === 'error') {
      console.error("Error de Google:", response.error);
    }
  }, [response]);

  const verifyTokenWithBackend = async (googleToken: string) => {
    try {
      console.log("Enviando token al backend...");
      
      const res = await axiosClient.post('/auth/google', { idToken: googleToken });
      const myFitnessJwt = res.data.token; 

      // Alternamos el método de guardado según la plataforma
      if (Platform.OS === 'web') {
        localStorage.setItem('jwt_token', myFitnessJwt);
      } else {
        await SecureStore.setItemAsync('jwt_token', myFitnessJwt);
      }
      
      console.log("¡Backend autenticado! JWT guardado localmente.");
      router.replace('/(tabs)/routines');

    } catch (error) {
      console.error("Error en la conexión con el backend:", error);
      Alert.alert("Error de validación", "No se pudo conectar con el servidor.");
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
        disabled={!request} 
        onPress={() => promptAsync()}
        className="w-full py-4 bg-white rounded-xl flex-row justify-center items-center active:opacity-80"
      >
        <Text className="text-black text-lg font-semibold tracking-wide">
          Continuar con Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}