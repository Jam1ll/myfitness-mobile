import { axiosClient } from '../../api/axiosClient';
import AppText from '@/components/common/AppText';
import CreateExerciseModal, {
  CreateExercisePayload,
} from '@/features/catalog/components/CreateExerciseModal';
import ExerciseDetailsModal, {
  ExerciseResponse,
} from '@/features/catalog/components/ExerciseDetailsModal';
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

function shortenDescription(description: string) {
  if (!description) return '';
  if (description.length <= 60) return description;
  return `${description.slice(0, 60)}…`;
}

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

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

  const fetchExercises = useCallback(
    async (page: number, tab: 'MINE' | 'CATALOG', search: string) => {
      setLoading(true);
      try {
        const isMine = tab === 'MINE';
        const response = await axiosClient.get(
          `/exercises?page=${page}&size=20&mineOnly=${isMine}&search=${search}`,
        );
        setExercises(response.data.content ?? []);
        setTotalPages(response.data.totalPages ?? 1);
        setCurrentPage(page);
      } catch {
        Alert.alert(t('common.error'), t('exercises.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchExercises(0, activeTab, searchQuery);
  }, [activeTab]);

  const handleSaveExercise = async (payload: CreateExercisePayload, id?: string) => {
    setIsSaving(true);
    try {
      if (id) {
        await axiosClient.put(`/exercises/${id}`, payload);
      } else {
        await axiosClient.post('/exercises', payload);
      }
      setIsModalVisible(false);
      setExerciseToEdit(null);
      await fetchExercises(0, activeTab, searchQuery);
    } catch {
      Alert.alert(t('common.error'), t('exercises.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    Alert.alert(t('exercises.deleteTitle'), t('exercises.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsDetailsModalVisible(false);
          try {
            await axiosClient.delete(`/exercises/${id}`);
            await fetchExercises(0, activeTab, searchQuery);
          } catch {
            Alert.alert(t('common.error'), t('exercises.deleteError'));
          }
        },
      },
    ]);
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
    } catch {
      Alert.alert(t('common.error'), t('exercises.loadDetailError'));
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
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1"
      edges={['top']}
    >
      {/* HEADER TABS/SEARCH */}
      <View className="px-6 mt-4 mb-2">
        <AppText
          weight="bold"
          style={{ color: colors.brand.primary }}
          className="text-3xl font-bold"
        >
          {t('exercises.title')}
        </AppText>
        <AppText
          style={{ color: colors.content.secondary }}
          className="text-base mt-1"
        >
          {t('exercises.subtitle')}
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
            {t('exercises.catalogTab')}
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
            {t('exercises.myExercisesTab')}
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
              ? t('exercises.searchPlaceholderCatalog')
              : t('exercises.searchPlaceholderMine')
          }
          placeholderTextColor={colors.content.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchExercises(0, activeTab, searchQuery)}
          returnKeyType="search"
          style={{ color: colors.brand.primary }}
          className="text-base ml-3 flex-1"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              fetchExercises(0, activeTab, '');
            }}
          >
            <Ionicons name="close-circle" size={18} color={colors.content.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* LISTA DE EJERCICIOS */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color={colors.brand.primary} size="large" />
        ) : (
          <View className="pb-20">
            {exercises.length === 0 ? (
              <View className="items-center justify-center mt-10">
                <AppText
                  style={{ color: colors.content.tertiary }}
                  className="text-base"
                >
                  {t('exercises.noExercisesFound')}
                </AppText>
              </View>
            ) : (
              <View className="px-4 flex-row flex-wrap">
                {exercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    activeOpacity={0.7}
                    className="w-1/2 px-2 mb-4"
                    onPress={() => handleOpenDetails(exercise.id)}
                  >
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="rounded-2xl p-4 border min-h-[140px] justify-between"
                    >
                      <View>
                        <View className="flex-row items-center justify-between mb-3">
                          <View
                            style={{ backgroundColor: colors.brand.surfaceAlt }}
                            className="rounded-lg px-2 py-1"
                          >
                            <AppText
                              style={{ color: colors.content.secondary }}
                              className="text-xs"
                            >
                              {exercise.muscleGroup}
                            </AppText>
                          </View>
                          {exercise.exercisePrivate && (
                            <Ionicons
                              name="lock-closed"
                              size={14}
                              color={colors.content.secondary}
                            />
                          )}
                        </View>
                        <AppText
                          weight="bold"
                          style={{ color: colors.brand.primary }}
                          className="text-base font-semibold mb-1"
                          numberOfLines={2}
                        >
                          {exercise.name}
                        </AppText>
                      </View>
                      <AppText
                        style={{ color: colors.content.tertiary }}
                        className="text-xs mt-2"
                        numberOfLines={2}
                      >
                        {shortenDescription(exercise.description)}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {totalPages > 1 && (
              <View className="flex-row items-center justify-between mx-6 mt-6 mb-8">
                <TouchableOpacity
                  onPress={handlePrevPage}
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
                  onPress={handleNextPage}
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

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openCreateModal}
        style={{ backgroundColor: colors.brand.primary }}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color={colors.brand.background} />
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
