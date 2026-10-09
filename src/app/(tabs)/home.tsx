import Ionicons from '@expo/vector-icons/Ionicons';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';

type WorkoutResponse = {
  id: string;
  name: string;
  exerciseIds: string[];
};

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<WorkoutResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        let name = null;
        if (Platform.OS === 'web') {
          name = localStorage.getItem('user_name');
        } else {
          name = await SecureStore.getItemAsync('user_name');
        }
        if (name) setUserName(name);
      } catch (error) {
        console.error("Error cargando el nombre:", error);
      }
    };

    const fetchWorkouts = async () => {
      try {
        const response = await axiosClient.get('/workouts');
        setRoutines(response.data.content ?? []);
      } catch (error) {
        console.error('Error fetching routines:', error);
        Alert.alert('Error', 'Your routines could not be fetched.');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
    fetchWorkouts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-8">
          <View className="mt-4 mb-8">
            <Text className="text-gray-400 text-base">Hello, {userName || 'user'}</Text>
            <Text className="text-white text-3xl font-bold mt-1">
              Ready to train
            </Text>
          </View>

          <View className="bg-zinc-900 rounded-3xl p-6 mb-10 border border-zinc-800">
            <View className="flex-row items-center mb-3">
              <View className="bg-zinc-800 rounded-full p-2 mr-3">
                <Ionicons name="flash-outline" size={18} color="#ffffff" />
              </View>
              <Text className="text-gray-400 text-sm font-medium tracking-wide">
                FEATURED SESSION
              </Text>
            </View>

            <Text className="text-white text-2xl font-bold mb-1">
              Today's training
            </Text>
            <Text className="text-gray-400 text-base mb-6">
              Hypertrophy · Push A · 8 exercises
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-white rounded-xl py-4 flex-row items-center justify-center"
            >
              <Ionicons name="play" size={16} color="#000000" />
              <Text className="text-black text-base font-semibold ml-2">
                Start
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white text-xl font-semibold mb-4">
            Your active routines
          </Text>

          {loading ? (
            <ActivityIndicator className="mt-10" color="#ffffff" size="large" />
          ) : routines.length > 0 ? (
            <>
              <View className="bg-zinc-900 rounded-3xl p-6 mb-10 border border-zinc-800">
                <View className="flex-row items-center mb-3">
                  <View className="bg-zinc-800 rounded-full p-2 mr-3">
                    <Ionicons name="flash-outline" size={18} color="#ffffff" />
                  </View>
                  <Text className="text-gray-400 text-sm font-medium tracking-wide">
                    LAST CREATED ROUTINE
                  </Text>
                </View>
                <Text className="text-white text-2xl font-bold mb-1">
                  {routines[0].name}
                </Text>
                <Text className="text-gray-400 text-base mb-6">
                  {routines[0].exerciseIds.length} exercises configured
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="bg-white rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Ionicons name="play" size={16} color="#000000" />
                  <Text className="text-black text-base font-semibold ml-2">
                    Start
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-white text-xl font-semibold mb-4">
                Your active routines
              </Text>
              {routines.slice(1).map((routine) => (
                <View key={routine.id} className="bg-zinc-900 rounded-2xl p-5 mb-4 border border-zinc-800">
                  <View className="flex-row items-start">
                    <View className="bg-zinc-800 rounded-xl p-3 mr-4">
                      <Ionicons name="barbell-outline" size={22} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-semibold">{routine.name}</Text>
                      <Text className="text-gray-400 text-sm mt-1">{routine.exerciseIds.length} exercises</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View className="items-center mt-10">
              <Text className="text-gray-400 text-base">You don't have any routines.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
