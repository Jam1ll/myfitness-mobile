import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAuthToken } from '../../api/axiosClient';

export default function AccountScreen() {
  const handleLogout = async () => {
    try {
      await setAuthToken(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black justify-between px-6 py-8" edges={['top']}>
      <View>
        <Text className="text-white text-3xl font-bold mt-4">Account</Text>
        <Text className="text-gray-400 text-base mt-1">Manage your profile and session</Text>
      </View>

      {/* Botón de Log Out */}
      <View className="mb-6">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 text-base font-semibold ml-2">
            Log out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}