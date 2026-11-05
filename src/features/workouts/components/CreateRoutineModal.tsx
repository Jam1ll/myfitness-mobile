import ExerciseSelectorModal from './ExerciseSelectorModal';
import { axiosClient } from '@/api/axiosClient';
import AppText from '@/components/common/AppText';
import type {
  CreateRoutinePayload,
  RoutineDetailResponse,
  RoutineExerciseItemDto,
} from '@/features/workouts/types';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface CreateRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (payload: CreateRoutinePayload, id?: string) => void;
  isSaving: boolean;
  initialData?: RoutineDetailResponse | null;
}

export default function CreateRoutineModal({
  isVisible,
  onClose,
  onSave,
  isSaving,
  initialData,
}: CreateRoutineModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [routineExercises, setRoutineExercises] = useState<RoutineExerciseItemDto[]>([]);
  const [exerciseDetailsMap, setExerciseDetailsMap] = useState<
    Record<string, { name: string; muscleGroup: string }>
  >({});
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setName(initialData.name || '');
        setIsPrivate(initialData.routinePrivate ?? false);

        if (initialData.enrichedRoutineExercises) {
          const items: RoutineExerciseItemDto[] = initialData.enrichedRoutineExercises.map(
            (ex, idx) => ({
              exerciseId: ex.exerciseId,
              targetSets: ex.targetSets ?? 3,
              targetReps: ex.targetReps ?? 10,
              restTimeSeconds: ex.restTimeSeconds ?? 60,
              orderIndex: ex.orderIndex ?? idx,
            }),
          );
          setRoutineExercises(items);

          const map: Record<string, { name: string; muscleGroup: string }> = {};
          initialData.enrichedRoutineExercises.forEach((ex) => {
            map[ex.exerciseId] = { name: ex.name, muscleGroup: ex.muscleGroup };
          });
          setExerciseDetailsMap(map);
        }
      } else {
        setName('');
        setIsPrivate(false);
        setRoutineExercises([]);
        setExerciseDetailsMap({});
      }
    }
  }, [isVisible, initialData]);

  const handleConfirmExercises = async (selectedIds: string[]) => {
    const updatedItems: RoutineExerciseItemDto[] = selectedIds.map((id, index) => {
      const existing = routineExercises.find((item) => item.exerciseId === id);
      return (
        existing || {
          exerciseId: id,
          targetSets: 3,
          targetReps: 10,
          restTimeSeconds: 60,
          orderIndex: index,
        }
      );
    });

    setRoutineExercises(updatedItems);

    try {
      const response = await axiosClient.get('/exercises?page=0&size=100');
      const allExs = response.data.content || [];
      const map: Record<string, { name: string; muscleGroup: string }> = {};
      allExs.forEach((ex: any) => {
        if (selectedIds.includes(ex.id)) {
          map[ex.id] = { name: ex.name, muscleGroup: ex.muscleGroup };
        }
      });
      setExerciseDetailsMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateItemMeta = (
    exerciseId: string,
    field: keyof RoutineExerciseItemDto,
    value: number,
  ) => {
    setRoutineExercises((prev) =>
      prev.map((item) =>
        item.exerciseId === exerciseId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setRoutineExercises((prev) => prev.filter((item) => item.exerciseId !== exerciseId));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('routines.nameRequired'));
      return;
    }
    if (routineExercises.length === 0) {
      Alert.alert(t('common.error'), t('routines.exerciseRequired'));
      return;
    }

    const payload: CreateRoutinePayload = {
      name: name.trim(),
      routineExerciseItems: routineExercises.map((item, index) => ({
        ...item,
        orderIndex: index,
      })),
      routinePrivate: isPrivate ?? false,
    };

    onSave(payload, initialData?.id);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          style={{ backgroundColor: colors.brand.background + 'B3' }}
          className="absolute inset-0"
          onPress={onClose}
        />

        <View
          style={{ backgroundColor: colors.brand.surface }}
          className="rounded-t-3xl px-6 pt-3 pb-10 max-h-[90%] min-h-[80%]"
        >
          <View className="items-center mb-4">
            <View
              style={{ backgroundColor: colors.brand.muted }}
              className="w-12 h-1.5 rounded-full"
            />
          </View>

          <AppText
            weight="bold"
            style={{ color: colors.brand.primary }}
            className="text-2xl font-bold mb-4"
          >
            {initialData ? t('routines.editRoutine') : t('routines.createRoutine')}
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Routine Name */}
            <AppText
              weight="bold"
              style={{ color: colors.content.secondary }}
              className="text-xs font-semibold mb-1 uppercase tracking-wider"
            >
              {t('routines.routineNameLabel')}
            </AppText>
            <TextInput
              placeholder={t('routines.routineNamePlaceholder')}
              placeholderTextColor={colors.content.muted}
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: colors.brand.background,
                color: colors.brand.primary,
                borderColor: colors.brand.surfaceBorder,
              }}
              className="text-base px-4 py-3.5 rounded-xl border mb-4"
            />

            {/* Privacy */}
            <View
              style={{
                backgroundColor: colors.brand.background,
                borderColor: colors.brand.surfaceBorder,
              }}
              className="flex-row items-center justify-between p-4 rounded-xl border mb-6"
            >
              <View className="flex-1 mr-3">
                <AppText
                  weight="bold"
                  style={{ color: colors.brand.primary }}
                  className="font-semibold text-base"
                >
                  {t('routines.privateRoutine')}
                </AppText>
                <AppText
                  style={{ color: colors.content.tertiary }}
                  className="text-xs"
                >
                  {t('routines.privateRoutineDescription')}
                </AppText>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.brand.surfaceBorder, true: colors.status.info }}
                thumbColor={colors.brand.primary}
              />
            </View>

            {/* Exercises List */}
            <View className="flex-row items-center justify-between mb-3">
              <AppText
                weight="bold"
                style={{ color: colors.brand.primary }}
                className="text-lg font-bold"
              >
                {t('routines.exercisesWithCount', { count: routineExercises.length })}
              </AppText>
              <TouchableOpacity
                onPress={() => setIsSelectorVisible(true)}
                style={{ backgroundColor: colors.brand.surfaceAlt }}
                className="px-3 py-1.5 rounded-lg flex-row items-center"
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={colors.brand.primary}
                  style={{ marginRight: 4 }}
                />
                <AppText
                  weight="semibold"
                  style={{ color: colors.brand.primary }}
                  className="text-xs font-semibold"
                >
                  {t('routines.addExercises')}
                </AppText>
              </TouchableOpacity>
            </View>

            {routineExercises.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.brand.background,
                  borderColor: colors.brand.surfaceBorder,
                }}
                className="border border-dashed rounded-xl p-6 items-center justify-center mb-4"
              >
                <AppText
                  style={{ color: colors.content.tertiary }}
                  className="text-sm"
                >
                  {t('routines.noExercisesAdded')}
                </AppText>
              </View>
            ) : (
              routineExercises.map((item, index) => {
                const details = exerciseDetailsMap[item.exerciseId] || {
                  name: 'Exercise',
                  muscleGroup: '',
                };
                return (
                  <View
                    key={item.exerciseId}
                    style={{
                      backgroundColor: colors.brand.background,
                      borderColor: colors.brand.surfaceBorder,
                    }}
                    className="border rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1 mr-2">
                        <AppText
                          weight="bold"
                          style={{ color: colors.brand.primary }}
                          className="font-bold text-base"
                          numberOfLines={1}
                        >
                          {index + 1}. {details.name}
                        </AppText>
                        <AppText
                          style={{ color: colors.content.tertiary }}
                          className="text-xs"
                        >
                          {details.muscleGroup}
                        </AppText>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveExercise(item.exerciseId)}>
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.status.dangerLight}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Inputs: Sets, Reps, Rest */}
                    <View
                      style={{ borderTopColor: colors.brand.surface }}
                      className="flex-row gap-2 mt-2 pt-2 border-t"
                    >
                      <View className="flex-1">
                        <AppText
                          weight="bold"
                          style={{ color: colors.content.muted }}
                          className="text-[10px] uppercase font-bold mb-1 text-center"
                        >
                          {t('routines.sets')}
                        </AppText>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.targetSets)}
                          onChangeText={(val) =>
                            handleUpdateItemMeta(item.exerciseId, 'targetSets', parseInt(val) || 0)
                          }
                          style={{
                            backgroundColor: colors.brand.surface,
                            color: colors.brand.primary,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="text-center py-1.5 rounded-lg border text-sm font-semibold"
                        />
                      </View>
                      <View className="flex-1">
                        <AppText
                          weight="bold"
                          style={{ color: colors.content.muted }}
                          className="text-[10px] uppercase font-bold mb-1 text-center"
                        >
                          {t('routines.reps')}
                        </AppText>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.targetReps)}
                          onChangeText={(val) =>
                            handleUpdateItemMeta(item.exerciseId, 'targetReps', parseInt(val) || 0)
                          }
                          style={{
                            backgroundColor: colors.brand.surface,
                            color: colors.brand.primary,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="text-center py-1.5 rounded-lg border text-sm font-semibold"
                        />
                      </View>
                      <View className="flex-1">
                        <AppText
                          weight="bold"
                          style={{ color: colors.content.muted }}
                          className="text-[10px] uppercase font-bold mb-1 text-center"
                        >
                          {t('routines.restSeconds')}
                        </AppText>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.restTimeSeconds)}
                          onChangeText={(val) =>
                            handleUpdateItemMeta(
                              item.exerciseId,
                              'restTimeSeconds',
                              parseInt(val) || 0,
                            )
                          }
                          style={{
                            backgroundColor: colors.brand.surface,
                            color: colors.brand.primary,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="text-center py-1.5 rounded-lg border text-sm font-semibold"
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSaving}
            style={{ backgroundColor: colors.brand.primary }}
            className="rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            {isSaving ? (
              <ActivityIndicator color={colors.brand.background} size="small" />
            ) : (
              <AppText
                weight="bold"
                style={{ color: colors.brand.background }}
                className="text-base font-semibold"
              >
                {initialData ? t('routines.saveChanges') : t('routines.createRoutine')}
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        <ExerciseSelectorModal
          isVisible={isSelectorVisible}
          onClose={() => setIsSelectorVisible(false)}
          onConfirm={handleConfirmExercises}
          initialSelectedIds={routineExercises.map((e) => e.exerciseId)}
        />
      </View>
    </Modal>
  );
}
