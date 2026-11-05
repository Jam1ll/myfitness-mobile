import AppText from '@/components/common/AppText';
import type { RoutineDetailResponse } from '@/features/workouts/types';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

interface RoutineDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  routine: RoutineDetailResponse | null;
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (routine: RoutineDetailResponse) => void;
}

export default function RoutineDetailsModal({
  isVisible,
  onClose,
  routine,
  loading,
  onDelete,
  onEdit,
}: RoutineDetailsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const exercises = routine?.enrichedRoutineExercises ?? [];

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
          className="rounded-t-3xl px-6 pt-3 pb-10 min-h-[60%] max-h-[90%]"
        >
          <View className="items-center mb-6">
            <View
              style={{ backgroundColor: colors.brand.muted }}
              className="w-12 h-1.5 rounded-full"
            />
          </View>

          {loading || !routine ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color={colors.brand.primary} size="large" />
              <AppText
                style={{ color: colors.content.secondary }}
                className="mt-4"
              >
                {t('routines.loadingRoutine')}
              </AppText>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <AppText
                  style={{ color: colors.content.secondary }}
                  className="text-sm"
                >
                  {t('routines.createdBy', { name: routine.createdBy || 'Unknown' })}
                </AppText>
                <View
                  style={{ backgroundColor: colors.brand.surfaceAlt + '80' }}
                  className="flex-row items-center rounded-full px-3 py-1"
                >
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
                    className="text-xs ml-1.5"
                  >
                    {routine.routinePrivate ? t('routines.private') : t('routines.public')}
                  </AppText>
                </View>
              </View>

              <AppText
                weight="bold"
                style={{ color: colors.brand.primary }}
                className="text-3xl font-bold mb-6"
              >
                {routine.name}
              </AppText>
              <AppText
                weight="bold"
                style={{ color: colors.brand.primary }}
                className="text-lg font-semibold mb-4"
              >
                {t('routines.exercisesWithCount', { count: exercises.length })}
              </AppText>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
                {exercises.length === 0 ? (
                  <AppText
                    style={{ color: colors.content.tertiary }}
                    className="italic mt-2"
                  >
                    {t('routines.noExercisesDetail')}
                  </AppText>
                ) : (
                  exercises.map((ex, index) => (
                    <View
                      key={`${ex.exerciseId}-${index}`}
                      style={{
                        backgroundColor: colors.brand.surfaceAlt + '80',
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="rounded-xl p-4 mb-3 border"
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <AppText
                          weight="bold"
                          style={{ color: colors.brand.primary }}
                          className="text-base font-semibold"
                        >
                          {ex.name || 'Exercise'}
                        </AppText>
                        {ex.muscleGroup ? (
                          <View
                            style={{ backgroundColor: colors.brand.surfaceAlt }}
                            className="px-2 py-1 rounded"
                          >
                            <AppText
                              style={{ color: colors.content.tertiary }}
                              className="text-xs"
                            >
                              {ex.muscleGroup}
                            </AppText>
                          </View>
                        ) : null}
                      </View>

                      {ex.description ? (
                        <AppText
                          style={{ color: colors.content.secondary }}
                          className="text-xs mb-2"
                          numberOfLines={2}
                        >
                          {ex.description}
                        </AppText>
                      ) : null}

                      <View
                        style={{ borderTopColor: colors.brand.borderMuted + '80' }}
                        className="flex-row gap-4 mt-2 pt-2 border-t"
                      >
                        <AppText
                          style={{ color: colors.content.secondary }}
                          className="text-xs"
                        >
                          {t('routines.sets')}:{' '}
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="font-bold"
                          >
                            {ex.targetSets ?? 0}
                          </AppText>
                        </AppText>
                        <AppText
                          style={{ color: colors.content.secondary }}
                          className="text-xs"
                        >
                          {t('routines.reps')}:{' '}
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="font-bold"
                          >
                            {ex.targetReps ?? 0}
                          </AppText>
                        </AppText>
                        <AppText
                          style={{ color: colors.content.secondary }}
                          className="text-xs"
                        >
                          {t('routines.restSeconds')}:{' '}
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="font-bold"
                          >
                            {ex.restTimeSeconds ?? 0}s
                          </AppText>
                        </AppText>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Action buttons */}
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  style={{
                    backgroundColor: colors.brand.surfaceAlt,
                    borderColor: colors.brand.borderMuted,
                  }}
                  className="flex-1 border rounded-xl py-4 flex-row items-center justify-center"
                >
                  <AppText
                    weight="bold"
                    style={{ color: colors.brand.primary }}
                    className="text-base font-semibold"
                  >
                    {t('common.close')}
                  </AppText>
                </TouchableOpacity>

                {routine.routineOwner && (
                  <>
                    {onEdit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onEdit(routine)}
                        style={{
                          backgroundColor: colors.status.info + '1A',
                          borderColor: colors.status.info + '4D',
                        }}
                        className="border rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="pencil" size={20} color={colors.status.info} />
                      </TouchableOpacity>
                    )}
                    {onDelete && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onDelete(routine.id)}
                        style={{
                          backgroundColor: colors.status.danger + '1A',
                          borderColor: colors.status.danger + '4D',
                        }}
                        className="border rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.status.danger} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
