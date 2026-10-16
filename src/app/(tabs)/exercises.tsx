import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';

const MUSCLE_GROUPS = [
  'CHEST', 'BACK', 'ARMS', 'LEGS', 'CORE', 'SHOULDERS',
] as const;

type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

type ExerciseResponse = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
};

function shortenDescription(description: string) {
  if (!description) return '';
  if (description.length <= 60) return description;
  return `${description.slice(0, 60)}…`;
}

export default function ExercisesScreen() {
  const [workouts, setWorkouts] = useState<ExerciseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('CHEST');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchExercises = useCallback(async () => {
    try {
      const response = await axiosClient.get('/exercises');
      setWorkouts(response.data.content ?? []);
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setMuscleGroup('CHEST');
    setIsPrivate(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalVisible(false);
  };

  const handleCreateExercise = async () => {
    // Validamos localmente antes de hacer la petición para ahorrar viajes a K8s
    if (!name || name.trim().length < 3) {
      Alert.alert('Validation Error', 'Exercise name must have at least 3 characters.');
      return;
    }
    if (!description || description.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must have at least 10 characters.');
      return;
    }

    setIsSaving(true);
    try {
      await axiosClient.post('/exercises', {
        name, description, muscleGroup, isPrivate,
      });
      setIsModalVisible(false);
      resetForm();
      await fetchExercises();
    } catch (error: any) {
      console.error('Error completo del servidor:', JSON.stringify(error.response?.data, null, 2));
      
      // Como el backend devuelve un 400 por validación fallida, informamos al usuario de forma clara
      Alert.alert(
        'Validation Error', 
        'Please check that your description has at least 10 characters and all fields are filled correctly.'
      );
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pb-8">
          <View className="px-6 mt-4 mb-5">
            <Text className="text-white text-3xl font-bold">Exercises</Text> 
            <Text className="text-gray-400 text-base mt-1">Browse individual movements</Text>
          </View>

          <View className="mx-6 mb-5 bg-zinc-900 rounded-2xl px-4 py-4 flex-row items-center border border-zinc-800">
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput 
              placeholder="Search exercises..." 
              placeholderTextColor="#9ca3af"
              className="text-white text-base ml-3 flex-1"
            />
          </View>

          {loading ? (
            <ActivityIndicator className="mt-10" color="#ffffff" size="large" />
          ) : (
            <View className="px-4 flex-row flex-wrap">
              {workouts.map((workout) => (
                <View key={workout.id} className="w-1/2 px-2 mb-4">
                  <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 min-h-[140px] justify-between">
                    <View>
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="bg-zinc-800 rounded-lg px-2 py-1">
                          <Text className="text-gray-400 text-xs">{workout.muscleGroup}</Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.8} className="bg-white rounded-full w-7 h-7 items-center justify-center">
                          <Ionicons name="add" size={16} color="#000000" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-white text-base font-semibold mb-1" numberOfLines={2}>
                        {workout.name}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-2" numberOfLines={2}>
                      {shortenDescription(workout.description)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsModalVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white items-center justify-center"
      >
        <Ionicons name="add" size={28} color="#000000" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          <Pressable className="absolute inset-0 bg-black/70" onPress={closeModal} />

          <View className="bg-zinc-900 rounded-t-3xl px-6 pt-3 pb-10">
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 rounded-full bg-zinc-600" />
            </View>

            <Text className="text-white text-2xl font-bold mb-6">
              Create exercise
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Exercise name..."
              placeholderTextColor="#6b7280"
              className="bg-black text-white border border-zinc-800 rounded-xl px-4 py-3 mb-4"
            />

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-black text-white border border-zinc-800 rounded-xl px-4 py-3 mb-4 h-28"
            />

            <Text className="text-gray-400 text-sm font-medium mb-3">
              Muscle group
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
            >
              <View className="flex-row">
                {MUSCLE_GROUPS.map((group) =>
                  muscleGroup === group ? (
                    <TouchableOpacity
                      key={group}
                      activeOpacity={0.8}
                      onPress={() => setMuscleGroup(group)}
                      className="rounded-full px-4 py-2 mr-2 bg-white"
                    >
                      <Text className="text-sm font-medium text-black">
                        {group}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={group}
                      activeOpacity={0.8}
                      onPress={() => setMuscleGroup(group)}
                      className="rounded-full px-4 py-2 mr-2 bg-zinc-800"
                    >
                      <Text className="text-sm font-medium text-gray-400">
                        {group}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </ScrollView>

            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-gray-400 flex-1 mr-4">
                Private exercise (Only you can see it)
              </Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#3f3f46', true: '#ffffff' }}
                thumbColor={isPrivate ? '#000000' : '#a1a1aa'}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCreateExercise}
              disabled={isSaving}
              className="bg-white rounded-xl py-4 flex-row items-center justify-center"
            >
              {isSaving ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text className="text-black text-base font-semibold">
                  Save Exercise
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}