import CreateRoutineModal from '@/features/workouts/components/CreateRoutineModal';
import RoutineDetailsModal from '@/features/workouts/components/RoutineDetailsModal';
import type { CreateRoutinePayload, RoutineDetailResponse } from '@/features/workouts/types';
import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'MINE' | 'CATALOG'>('CATALOG');

  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<RoutineDetailResponse | null>(null);

  const fetchRoutines = useCallback(async (page: number, tab: 'MINE' | 'CATALOG', search: string) => {
    setLoading(true);
    try {
      const isMine = tab === 'MINE';
      const response = await axiosClient.get(`/workouts/routines?page=${page}&size=20&mineOnly=${isMine}&search=${search}`);
      setRoutines(response.data.content ?? []);
      setTotalPages(response.data.totalPages ?? 1);
      setCurrentPage(page);
    } catch (error: any) {
      console.log("❌ Error al cargar rutinas HTTP Status:", error.response?.status);
      console.log("📄 Detalles del error:", error.message, JSON.stringify(error.response?.data, null, 2));

      Alert.alert('Error', 'No se pudieron cargar las rutinas.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchRoutines(0, activeTab, searchQuery);
  }, [activeTab]);

  const handleOpenDetails = async (id: string) => {
    setIsDetailsModalVisible(true);
    setLoadingDetails(true);
    try {
      const response = await axiosClient.get(`/workouts/routines/${id}`);
      setSelectedRoutine(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la rutina detallada.');
      setIsDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveRoutine = async (payload: CreateRoutinePayload, id?: string) => {
    setIsSaving(true);
    try {
      if (id) {
        // Editar
        await axiosClient.put(`/workouts/routines/${id}`, payload);
      } else {
        // Crear
        await axiosClient.post('/workouts/routines', payload);
      }
      setIsModalVisible(false);
      setRoutineToEdit(null);
      await fetchRoutines(0, activeTab, searchQuery);
    } catch (error: any) {
      console.log("❌ Error HTTP Status:", error.response?.status);
      console.log("📄 Detalles del rechazo del backend:", JSON.stringify(error.response?.data, null, 2));

      Alert.alert('Error', 'Revisa la consola de Expo para ver los detalles.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
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
              await axiosClient.delete(`/workouts/routines/${id}`);
              await fetchRoutines(0, activeTab, searchQuery);
            } catch (error) {
              Alert.alert('Error', 'Could not delete the routine.');
            }
          }
        }
      ]
    );
  };

  const handleEditRoutine = (routine: RoutineDetailResponse) => {
    setIsDetailsModalVisible(false);
    setRoutineToEdit(routine);

    setTimeout(() => {
      setIsModalVisible(true);
    }, 300);
  };

  const openCreateModal = () => {
    setRoutineToEdit(null);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
      <View className="px-6 mt-4 mb-2">
        <Text className="text-brand-primary text-3xl font-bold">Routines</Text>
        <Text className="text-content-secondary text-base mt-1">Explore and manage routines</Text>
      </View>

      <View className="px-6 flex-row mb-5 mt-2">
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('CATALOG')} className={`mr-4 pb-2 border-b-2 ${activeTab === 'CATALOG' ? 'border-brand-primary' : 'border-transparent'}`}>
          <Text className={`text-base font-semibold ${activeTab === 'CATALOG' ? 'text-brand-primary' : 'text-content-tertiary'}`}>Public Catalog</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => setActiveTab('MINE')} className={`pb-2 border-b-2 ${activeTab === 'MINE' ? 'border-brand-primary' : 'border-transparent'}`}>
          <Text className={`text-base font-semibold ${activeTab === 'MINE' ? 'text-brand-primary' : 'text-content-tertiary'}`}>My Routines</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-6 mb-4 bg-brand-surface rounded-2xl px-4 py-4 flex-row items-center border border-brand-surfaceBorder">
        <Ionicons name="search-outline" size={18} color={Colors.content.secondary} />
        <TextInput
          placeholder={`Search ${activeTab === 'CATALOG' ? 'catalog' : 'your routines'}...`}
          placeholderTextColor={Colors.content.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchRoutines(0, activeTab, searchQuery)}
          returnKeyType="search"
          className="text-brand-primary text-base ml-3 flex-1"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); fetchRoutines(0, activeTab, ''); }}>
            <Ionicons name="close-circle" size={18} color={Colors.content.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color={Colors.brand.primary} size="large" />
        ) : (
          <View className="pb-20">
            {routines.length === 0 ? (
              <View className="items-center justify-center mt-10">
                <Text className="text-content-tertiary text-base">No routines found.</Text>
              </View>
            ) : (
              <View className="px-4 flex-col">
                {routines.map((routine: any) => (
                  <TouchableOpacity key={routine.id} activeOpacity={0.7} className="px-2 mb-4" onPress={() => handleOpenDetails(routine.id)}>
                    <View className="bg-brand-surface rounded-2xl p-5 border border-brand-surfaceBorder flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name={routine.routinePrivate ? "lock-closed" : "globe-outline"} size={14} color={routine.routinePrivate ? Colors.status.dangerLight : Colors.status.infoLight} className="mr-2" />
                          <Text className="text-content-secondary text-xs ml-2">{routine.routinePrivate ? 'Private' : 'Public'}</Text>
                        </View>
                        <Text className="text-brand-primary text-xl font-bold" numberOfLines={1}>{routine.name}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.content.tertiary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {totalPages > 1 && (
              <View className="flex-row items-center justify-between mx-6 mt-4 mb-8">
                <TouchableOpacity onPress={() => { if (currentPage > 0) fetchRoutines(currentPage - 1, activeTab, searchQuery) }} disabled={currentPage === 0} className={`px-4 py-2 rounded-lg ${currentPage === 0 ? 'bg-brand-surface' : 'bg-brand-surfaceAlt'}`}>
                  <Text className={currentPage === 0 ? 'text-content-disabled' : 'text-brand-primary'}>Prev</Text>
                </TouchableOpacity>
                <Text className="text-content-secondary">Page {currentPage + 1} of {totalPages}</Text>
                <TouchableOpacity onPress={() => { if (currentPage < totalPages - 1) fetchRoutines(currentPage + 1, activeTab, searchQuery) }} disabled={currentPage >= totalPages - 1} className={`px-4 py-2 rounded-lg ${currentPage >= totalPages - 1 ? 'bg-brand-surface' : 'bg-brand-surfaceAlt'}`}>
                  <Text className={currentPage >= totalPages - 1 ? 'text-content-disabled' : 'text-brand-primary'}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity activeOpacity={0.85} onPress={openCreateModal} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand-primary items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color={Colors.brand.background} />
      </TouchableOpacity>

      <RoutineDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        routine={selectedRoutine}
        loading={loadingDetails}
        onDelete={handleDeleteRoutine}
        onEdit={handleEditRoutine}
      />

      <CreateRoutineModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveRoutine}
        isSaving={isSaving}
        initialData={routineToEdit}
      />

    </SafeAreaView>
  );
}