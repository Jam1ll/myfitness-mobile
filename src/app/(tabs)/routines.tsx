import { axiosClient } from '../../api/axiosClient';
import AppText from '@/components/common/AppText';
import CreateRoutineModal from '@/features/workouts/components/CreateRoutineModal';
import RoutineDetailsModal from '@/features/workouts/components/RoutineDetailsModal';
import type { CreateRoutinePayload, RoutineDetailResponse } from '@/features/workouts/types';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

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

  const fetchRoutines = useCallback(
    async (page: number, tab: 'MINE' | 'CATALOG', search: string) => {
      setLoading(true);
      try {
        const isMine = tab === 'MINE';
        const response = await axiosClient.get(
          `/workouts/routines?page=${page}&size=20&mineOnly=${isMine}&search=${search}`,
        );
        setRoutines(response.data.content ?? []);
        setTotalPages(response.data.totalPages ?? 1);
        setCurrentPage(page);
      } catch {
        Alert.alert(t('common.error'), t('routines.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchRoutines(0, activeTab, searchQuery);
  }, [activeTab]);

  const handleOpenDetails = async (id: string) => {
    setIsDetailsModalVisible(true);
    setLoadingDetails(true);
    try {
      const response = await axiosClient.get(`/workouts/routines/${id}`);
      setSelectedRoutine(response.data);
    } catch {
      Alert.alert(t('common.error'), t('routines.loadDetailError'));
      setIsDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveRoutine = async (payload: CreateRoutinePayload, id?: string) => {
    setIsSaving(true);
    try {
      if (id) {
        await axiosClient.put(`/workouts/routines/${id}`, payload);
      } else {
        await axiosClient.post('/workouts/routines', payload);
      }
      setIsModalVisible(false);
      setRoutineToEdit(null);
      await fetchRoutines(0, activeTab, searchQuery);
    } catch {
      Alert.alert(t('common.error'), t('routines.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    Alert.alert(t('routines.deleteTitle'), t('routines.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsDetailsModalVisible(false);
          try {
            await axiosClient.delete(`/workouts/routines/${id}`);
            await fetchRoutines(0, activeTab, searchQuery);
          } catch {
            Alert.alert(t('common.error'), t('routines.deleteError'));
          }
        },
      },
    ]);
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
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1"
      edges={['top']}
    >
      <View className="px-6 mt-4 mb-2">
        <AppText
          weight="bold"
          style={{ color: colors.brand.primary }}
          className="text-3xl font-bold"
        >
          {t('routines.title')}
        </AppText>
        <AppText
          style={{ color: colors.content.secondary }}
          className="text-base mt-1"
        >
          {t('routines.subtitle')}
        </AppText>
      </View>

      <View className="px-6 flex-row mb-5 mt-2">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('CATALOG')}
          style={{
            borderBottomColor:
              activeTab === 'CATALOG' ? colors.brand.primary : 'transparent',
          }}
          className="mr-4 pb-2 border-b-2"
        >
          <AppText
            weight={activeTab === 'CATALOG' ? 'bold' : 'regular'}
            style={{
              color:
                activeTab === 'CATALOG'
                  ? colors.brand.primary
                  : colors.content.tertiary,
            }}
            className="text-base font-semibold"
          >
            {t('routines.catalogTab')}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('MINE')}
          style={{
            borderBottomColor:
              activeTab === 'MINE' ? colors.brand.primary : 'transparent',
          }}
          className="pb-2 border-b-2"
        >
          <AppText
            weight={activeTab === 'MINE' ? 'bold' : 'regular'}
            style={{
              color:
                activeTab === 'MINE'
                  ? colors.brand.primary
                  : colors.content.tertiary,
            }}
            className="text-base font-semibold"
          >
            {t('routines.myRoutinesTab')}
          </AppText>
        </TouchableOpacity>
      </View>

      <View
        style={{
          backgroundColor: colors.brand.surface,
          borderColor: colors.brand.surfaceBorder,
        }}
        className="mx-6 mb-4 rounded-2xl px-4 py-4 flex-row items-center border"
      >
        <Ionicons name="search-outline" size={18} color={colors.content.secondary} />
        <TextInput
          placeholder={
            activeTab === 'CATALOG'
              ? t('routines.searchPlaceholderCatalog')
              : t('routines.searchPlaceholderMine')
          }
          placeholderTextColor={colors.content.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchRoutines(0, activeTab, searchQuery)}
          returnKeyType="search"
          style={{ color: colors.brand.primary }}
          className="text-base ml-3 flex-1"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              fetchRoutines(0, activeTab, '');
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.content.secondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color={colors.brand.primary} size="large" />
        ) : (
          <View className="pb-20">
            {routines.length === 0 ? (
              <View className="items-center justify-center mt-10">
                <AppText
                  style={{ color: colors.content.tertiary }}
                  className="text-base"
                >
                  {t('routines.noRoutinesFound')}
                </AppText>
              </View>
            ) : (
              <View className="px-4 flex-col">
                {routines.map((routine: any) => (
                  <TouchableOpacity
                    key={routine.id}
                    activeOpacity={0.7}
                    className="px-2 mb-4"
                    onPress={() => handleOpenDetails(routine.id)}
                  >
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="rounded-2xl p-5 border flex-row items-center justify-between"
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons
                            name={routine.routinePrivate ? 'lock-closed' : 'globe-outline'}
                            size={14}
                            color={
                              routine.routinePrivate
                                ? colors.status.dangerLight
                                : colors.status.infoLight
                            }
                          />
                          <AppText
                            style={{ color: colors.content.secondary }}
                            className="text-xs ml-2"
                          >
                            {routine.routinePrivate
                              ? t('routines.private')
                              : t('routines.public')}
                          </AppText>
                        </View>
                        <AppText
                          weight="bold"
                          style={{ color: colors.brand.primary }}
                          className="text-xl font-bold"
                          numberOfLines={1}
                        >
                          {routine.name}
                        </AppText>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.content.tertiary}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {totalPages > 1 && (
              <View className="flex-row items-center justify-between mx-6 mt-4 mb-8">
                <TouchableOpacity
                  onPress={() => {
                    if (currentPage > 0) fetchRoutines(currentPage - 1, activeTab, searchQuery);
                  }}
                  disabled={currentPage === 0}
                  style={{
                    backgroundColor:
                      currentPage === 0 ? colors.brand.surface : colors.brand.surfaceAlt,
                  }}
                  className="px-4 py-2 rounded-lg"
                >
                  <AppText
                    style={{
                      color:
                        currentPage === 0
                          ? colors.content.disabled
                          : colors.brand.primary,
                    }}
                  >
                    {t('common.prev')}
                  </AppText>
                </TouchableOpacity>

                <AppText style={{ color: colors.content.secondary }}>
                  {t('common.pageOf', { current: currentPage + 1, total: totalPages })}
                </AppText>

                <TouchableOpacity
                  onPress={() => {
                    if (currentPage < totalPages - 1)
                      fetchRoutines(currentPage + 1, activeTab, searchQuery);
                  }}
                  disabled={currentPage >= totalPages - 1}
                  style={{
                    backgroundColor:
                      currentPage >= totalPages - 1
                        ? colors.brand.surface
                        : colors.brand.surfaceAlt,
                  }}
                  className="px-4 py-2 rounded-lg"
                >
                  <AppText
                    style={{
                      color:
                        currentPage >= totalPages - 1
                          ? colors.content.disabled
                          : colors.brand.primary,
                    }}
                  >
                    {t('common.next')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openCreateModal}
        style={{ backgroundColor: colors.brand.primary }}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color={colors.brand.background} />
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
