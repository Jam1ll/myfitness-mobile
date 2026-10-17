import CreateExerciseModal, { CreateExercisePayload } from '@/features/catalog/components/CreateExerciseModal';
import ExerciseDetailsModal, { ExerciseResponse } from '@/features/catalog/components/ExerciseDetailsModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';


function shortenDescription(description: string) {
  if (!description) return '';
  if (description.length <= 60) return description;
  return `${description.slice(0, 60)}…`;
}

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'MINE' | 'CATALOG'>('CATALOG');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<ExerciseResponse | null>(null);

  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchExercises = useCallback(async (page: number, tab: 'MINE' | 'CATALOG', search: string) => {
    setLoading(true);
    try {
      const isMine = tab === 'MINE';
      const response = await axiosClient.get(`/exercises?page=${page}&size=20&mineOnly=${isMine}&search=${search}`);
      setExercises(response.data.content ?? []);
      setTotalPages(response.data.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los ejercicios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises(0, activeTab, searchQuery);
  }, [activeTab]);

  const handleSaveExercise = async (payload: CreateExercisePayload, id?: string) => {
    setIsSaving(true);
    try {
      if (id) {
        // Modo Edición -> PUT
        await axiosClient.put(`/exercises/${id}`, payload);
      } else {
        // Modo Creación -> POST
        await axiosClient.post('/exercises', payload);
      }
      setIsModalVisible(false);
      setExerciseToEdit(null);
      await fetchExercises(0, activeTab, searchQuery);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo guardar el ejercicio.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setIsDetailsModalVisible(false);
            try {
              await axiosClient.delete(`/exercises/${id}`);
              await fetchExercises(0, activeTab, searchQuery);
            } catch (error) {
              Alert.alert('Error', 'Could not delete the exercise.');
            }
          }
        }
      ]
    );
  };

  const handleEditExercise = (exercise: ExerciseResponse) => {
    setIsDetailsModalVisible(false);
    setExerciseToEdit(exercise);
    
    setTimeout(() => {
      setIsModalVisible(true);
    }, 300);
  };

  const openCreateModal = () => {
    setExerciseToEdit(null);
    setIsModalVisible(true);
  };

  const handleOpenDetails = async (id: string) => {
    setIsDetailsModalVisible(true);
    setLoadingDetails(true);
    try {
      const response = await axiosClient.get(`/exercises/${id}`);
      setSelectedExercise(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información detallada.');
      setIsDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) fetchExercises(currentPage + 1, activeTab, searchQuery);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) fetchExercises(currentPage - 1, activeTab, searchQuery);
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      {/* HEADER TABS/SEARCH */}
      <View className="px-6 mt-4 mb-2">
        <Text className="text-white text-3xl font-bold">Exercises</Text> 
        <Text className="text-gray-400 text-base mt-1">Browse and manage</Text>
      </View>

      <View className="px-6 flex-row mb-5 mt-2">
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('CATALOG')} className={`mr-4 pb-2 border-b-2 ${activeTab === 'CATALOG' ? 'border-white' : 'border-transparent'}`}>
          <Text className={`text-base font-semibold ${activeTab === 'CATALOG' ? 'text-white' : 'text-gray-500'}`}>Public Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('MINE')} className={`pb-2 border-b-2 ${activeTab === 'MINE' ? 'border-white' : 'border-transparent'}`}>
          <Text className={`text-base font-semibold ${activeTab === 'MINE' ? 'text-white' : 'text-gray-500'}`}>My Exercises</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-6 mb-4 bg-zinc-900 rounded-2xl px-4 py-4 flex-row items-center border border-zinc-800">
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput 
          placeholder={`Search ${activeTab === 'CATALOG' ? 'catalog' : 'your exercises'}...`} 
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchExercises(0, activeTab, searchQuery)}
          returnKeyType="search"
          className="text-white text-base ml-3 flex-1"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); fetchExercises(0, activeTab, ''); }}>
             <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA DE EJERCICIOS */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color="#ffffff" size="large" />
        ) : (
          <View className="pb-20">
            {exercises.length === 0 ? (
                <View className="items-center justify-center mt-10">
                    <Text className="text-gray-500 text-base">No exercises found.</Text>
                </View>
            ) : (
                <View className="px-4 flex-row flex-wrap">
                {exercises.map((exercise) => (
                    <TouchableOpacity key={exercise.id} activeOpacity={0.7} className="w-1/2 px-2 mb-4" onPress={() => handleOpenDetails(exercise.id)}>
                      <View className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 min-h-[140px] justify-between">
                          <View>
                          <View className="flex-row items-center justify-between mb-3">
                              <View className="bg-zinc-800 rounded-lg px-2 py-1">
                                <Text className="text-gray-400 text-xs">{exercise.muscleGroup}</Text>
                              </View>
                              {exercise.exercisePrivate && <Ionicons name="lock-closed" size={14} color="#9ca3af" />}
                          </View>
                          <Text className="text-white text-base font-semibold mb-1" numberOfLines={2}>
                              {exercise.name}
                          </Text>
                          </View>
                          <Text className="text-gray-500 text-xs mt-2" numberOfLines={2}>
                          {shortenDescription(exercise.description)}
                          </Text>
                      </View>
                    </TouchableOpacity>
                ))}
                </View>
            )}

            {totalPages > 1 && (
               <View className="flex-row items-center justify-between mx-6 mt-6 mb-8">
                  <TouchableOpacity onPress={handlePrevPage} disabled={currentPage === 0} className={`px-4 py-2 rounded-lg ${currentPage === 0 ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                      <Text className={currentPage === 0 ? 'text-zinc-600' : 'text-white'}>Prev</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-400">Page {currentPage + 1} of {totalPages}</Text>
                  <TouchableOpacity onPress={handleNextPage} disabled={currentPage >= totalPages - 1} className={`px-4 py-2 rounded-lg ${currentPage >= totalPages - 1 ? 'bg-zinc-900' : 'bg-zinc-800'}`}>
                      <Text className={currentPage >= totalPages - 1 ? 'text-zinc-600' : 'text-white'}>Next</Text>
                  </TouchableOpacity>
               </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity activeOpacity={0.85} onPress={openCreateModal} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="#000000" />
      </TouchableOpacity>

      {/* MODALS */}
      <ExerciseDetailsModal 
        isVisible={isDetailsModalVisible} 
        onClose={() => setIsDetailsModalVisible(false)} 
        exercise={selectedExercise} 
        loading={loadingDetails} 
        onDelete={handleDeleteExercise}
        onEdit={handleEditExercise}
      />
      
      <CreateExerciseModal 
        isVisible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
        onSave={handleSaveExercise} 
        isSaving={isSaving} 
        initialData={exerciseToEdit}
      />

    </SafeAreaView>
  );
}