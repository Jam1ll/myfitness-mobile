import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GoogleSignin } from '@react-native-google-signin/google-signin'; // If using this library
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAuthToken } from '../../api/axiosClient';

export default function AccountScreen() {
  const handleLogout = async () => {
    try {
      //Clear Axios token and local storage
      await setAuthToken(null);

      if (Platform.OS === 'web') {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_name');
      } else {
        await SecureStore.deleteItemAsync('user_token');
        await SecureStore.deleteItemAsync('user_name');

        // Disconnect from Google so account selection can be triggered again
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          console.log("Could not sign out from Google SDK (it might not be initialized):", e);
        }
      }

      // Redirect to login
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Could not log out.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-background justify-between px-6 py-8">
      <View>
        <Text className="text-brand-primary text-3xl font-bold mt-4">Account</Text>
        <Text className="text-content-secondary text-base mt-1">Manage your profile and session</Text>
      </View>

      {/* Log Out Button */}
      <View className="mb-6">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          className="bg-brand-surface border border-brand-surfaceBorder rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.status.danger} />
          <Text className="text-status-danger text-base font-semibold ml-2">
            Log out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}