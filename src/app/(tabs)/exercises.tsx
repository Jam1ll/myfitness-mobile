import AppText from '@/components/common/AppText';
import CreateExerciseModal, {
  CreateExercisePayload,
} from '@/features/catalog/components/CreateExerciseModal';
import ExerciseDetailsModal, {
  ExerciseResponse,
} from '@/features/catalog/components/ExerciseDetailsModal';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { catalogApi } from '@/api/catalogApi';

function shortenDescription(description: string) {
  if (!description) return '';
  if (description.length <= 60) return description;
  return `${description.slice(0, 60)}…`;
}

export default function ExercisesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'MINE' | 'CATALOG'>('CATALOG');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<ExerciseResponse | null>(null);

  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ── Query: exercises list ─────────────────────────────────────────────────
  const mineOnly = activeTab === 'MINE';
  const { data: exercisesPage, isLoading: loading } = useQuery({
    queryKey: ['exercises', { page: currentPage, mineOnly, search: searchQuery }],
    queryFn: () =>
      catalogApi.getExercises({ page: currentPage, size: 20, mineOnly, search: searchQuery }),
    staleTime: 30_000,
  });
  const exercises = (exercisesPage?.content ?? []) as ExerciseResponse[];
  const totalPages = exercisesPage?.totalPages ?? 1;

  // ── Mutation: save (create/update) exercise ───────────────────────────────
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: CreateExercisePayload; id?: string }) =>
      id ? catalogApi.updateExercise(id, payload) : catalogApi.createExercise(payload),
    onSuccess: () => {
      setIsModalVisible(false);
      setExerciseToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
    onError: () => {
      Alert.alert(t('common.error'), t('exercises.saveError'));
    },
  });

  // ── Mutation: delete exercise ─────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
    onError: () => {
      Alert.alert(t('common.error'), t('exercises.deleteError'));
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveExercise = (payload: CreateExercisePayload, id?: string) => {
    saveMutation.mutate({ payload, id });
  };

  const handleDeleteExercise = (id: string) => {
    Alert.alert(t('exercises.deleteTitle'), t('exercises.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setIsDetailsModalVisible(false);
          deleteMutation.mutate(id);
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
      const data = await catalogApi.getExerciseById(id);
      setSelectedExercise(data as ExerciseResponse);
    } catch {
      Alert.alert(t('common.error'), t('exercises.loadDetailError'));
      setIsDetailsModalVisible(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTabChange = (tab: 'MINE' | 'CATALOG') => {
    setActiveTab(tab);
    setCurrentPage(0);
  };

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1"
      edges={['top']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* HEADER TABS/SEARCH */}
        <Pressable onPress={Keyboard.dismiss}>
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
              onPress={() => handleTabChange('CATALOG')}
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
              onPress={() => handleTabChange('MINE')}
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
        </Pressable>

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
            onSubmitEditing={() => setCurrentPage(0)}
            returnKeyType="search"
            style={{ color: colors.brand.primary }}
            className="text-base ml-3 flex-1"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setCurrentPage(0);
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.content.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* LISTA DE EJERCICIOS */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
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
                  onPress={() => {
                    if (currentPage > 0) setCurrentPage(currentPage - 1);
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
                    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
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
        isSaving={saveMutation.isPending}
        initialData={exerciseToEdit}
      />
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}
