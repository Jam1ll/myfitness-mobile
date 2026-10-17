import CreateRoutineModal, { CreateRoutinePayload } from '@/features/workouts/components/CreateRoutineModal';
import RoutineDetailsModal, { WorkoutDetailResponse } from '@/features/workouts/components/RoutineDetailsModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';

export default function RoutinesScreen() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'MINE' | 'CATALOG'>('CATALOG');

  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<WorkoutDetailResponse | null>(null);

  const fetchWorkouts = useCallback(async (page: number, tab: 'MINE' | 'CATALOG', search: string) => {
    setLoading(true);
    try {
      const isMine = tab === 'MINE';
      const response = await axiosClient.get(`/workouts?page=${page}&size=20&mineOnly=${isMine}&search=${search}`);
      setWorkouts(response.data.content ?? []);
      setTotalPages(response.data.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las rutinas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts(0, activeTab, searchQuery);
  }, [activeTab]);

  const handleOpenDetails = async (id: string) => {
    setIsDetailsModalVisible(true);
    setLoadingDetails(true);
    try {
      const response = await axiosClient.get(`/workouts/${id}`);
      setSelectedWorkout(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la rutina detallada.');
      setIsDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveWorkout = async (payload: CreateRoutinePayload, id?: string) => {
    setIsSaving(true);
    try {
      if (id) {
        // Editar
        await axiosClient.put(`/workouts/${id}`, payload);
      } else {
        // Crear
        await axiosClient.post('/workouts', payload);
      }
      setIsModalVisible(false);
      setWorkoutToEdit(null);
      await fetchWorkouts(0, activeTab, searchQuery);
    } catch (error: unknown) {
      Alert.alert('Error', 'Revisa la consola de Expo para ver los detalles.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    Alert.alert(
      "Delete Routine",
      "Are you sure you want to delete this routine? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setIsDetailsModalVisible(false);
            try {
              await axiosClient.delete(`/workouts/${id}`);
              await fetchWorkouts(0, activeTab, searchQuery);
            } catch (error) {
              Alert.alert('Error', 'Could not delete the routine.');
            }
          }
        }
      ]
    );
  };

  const handleEditWorkout = (workout: WorkoutDetailResponse) => {
    setIsDetailsModalVisible(false);
    setWorkoutToEdit(workout);
    
    setTimeout(() => {
      setIsModalVisible(true);
    }, 300);
  };

  const openCreateModal = () => {
    setWorkoutToEdit(null);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="px-6 mt-4 mb-2">
        <Text className="text-white text-3xl font-bold">Routines</Text>
        <Text className="text-gray-400 text-base mt-1">Explore and manage routines</Text>
      </View>

      <View className="px-6 flex-row mb-5 mt-2">
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('CATALOG')} className={`mr-4 pb-2 border-b-2 ${activeTab === 'CATALOG' ? 'border-white' : 'border-transparent'}`}>
          <Text className={`text-base font-semibold ${activeTab === 'CATALOG' ? 'text-white' : 'text-gray-500'}`}>Public Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('MINE')} className={`pb-2 border-b-2 ${activeTab === 'MINE' ? 'border-white' : 'border-transparent'}`}>
          <Text className={`text-base font-semibold ${activeTab === 'MINE' ? 'text-white' : 'text-gray-500'}`}>My Routines</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-6 mb-4 bg-zinc-900 rounded-2xl px-4 py-4 flex-row items-center border border-zinc-800">
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          placeholder={`Search ${activeTab === 'CATALOG' ? 'catalog' : 'your routines'}...`}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchWorkouts(0, activeTab, searchQuery)}
          returnKeyType="search"
          className="text-white text-base ml-3 flex-1"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); fetchWorkouts(0, activeTab, ''); }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color="#ffffff" size="large" />
        ) : (
          <View className="pb-20">
            {workouts.length === 0 ? (
              <View className="items-center justify-center mt-10">
                <Text className="text-gray-500 text-base">No routines found.</Text>
              </View>
            ) : (
              <View className="px-4 flex-col">
                {workouts.map((workout: any) => (
                  <TouchableOpacity key={workout.id} activeOpacity={0.7} className="px-2 mb-4" onPress={() => handleOpenDetails(workout.id)}>
                    <View className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name={workout.workoutPrivate ? "lock-closed" : "globe-outline"} size={14} color={workout.workoutPrivate ? "#f87171" : "#60a5fa"} className="mr-2" />
                          <Text className="text-gray-400 text-xs ml-2">{workout.workoutPrivate ? 'Private' : 'Public'}</Text>
                        </View>
                        <Text className="text-white text-xl font-bold" numberOfLines={1}>{workout.name}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {totalPages > 1 && (
              <View className="flex-row items-center justify-between mx-6 mt-4 mb-8">
                <TouchableOpacity onPress={() => { if(currentPage > 0) fetchWorkouts(currentPage - 1, activeTab, searchQuery) }} disabled={currentPage === 0} className={`px-4 py-2 rounded-lg ${currentPage === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                  <Text className={currentPage === 0 ? 'text-zinc-600' : 'text-white'}>Prev</Text>
                </TouchableOpacity>
                <Text className="text-gray-400">Page {currentPage + 1} of {totalPages}</Text>
                <TouchableOpacity onPress={() => { if(currentPage < totalPages - 1) fetchWorkouts(currentPage + 1, activeTab, searchQuery) }} disabled={currentPage >= totalPages - 1} className={`px-4 py-2 rounded-lg ${currentPage >= totalPages - 1 ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                  <Text className={currentPage >= totalPages - 1 ? 'text-zinc-600' : 'text-white'}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} onPress={openCreateModal} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="#000000" />
      </TouchableOpacity>

      <RoutineDetailsModal 
        isVisible={isDetailsModalVisible} 
        onClose={() => setIsDetailsModalVisible(false)} 
        workout={selectedWorkout} 
        loading={loadingDetails} 
        onDelete={handleDeleteWorkout}
        onEdit={handleEditWorkout}
      />
      
      <CreateRoutineModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSave={handleSaveWorkout} 
        isSaving={isSaving}
        initialData={workoutToEdit}
      />

    </SafeAreaView>
  );
}