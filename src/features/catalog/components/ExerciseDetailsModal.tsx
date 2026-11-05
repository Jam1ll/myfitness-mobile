import AppText from '@/components/common/AppText';
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

export type ExerciseResponse = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  exercisePrivate: boolean;
  exerciseOwner: boolean;
};

interface ExerciseDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  exercise: ExerciseResponse | null;
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (exercise: ExerciseResponse) => void;
}

export default function ExerciseDetailsModal({
  isVisible,
  onClose,
  exercise,
  loading,
  onDelete,
  onEdit,
}: ExerciseDetailsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
          className="rounded-t-3xl px-6 pt-3 pb-10 min-h-[50%] max-h-[85%]"
        >
          <View className="items-center mb-6">
            <View
              style={{ backgroundColor: colors.brand.muted }}
              className="w-12 h-1.5 rounded-full"
            />
          </View>

          {loading || !exercise ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color={colors.brand.primary} size="large" />
              <AppText
                style={{ color: colors.content.secondary }}
                className="mt-4"
              >
                {t('exercises.loadingDetails')}
              </AppText>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-4">
                <View
                  style={{ backgroundColor: colors.brand.surfaceAlt }}
                  className="rounded-lg px-3 py-1.5"
                >
                  <AppText
                    weight="semibold"
                    style={{ color: colors.content.secondary }}
                    className="font-medium"
                  >
                    {t(`exercises.muscleGroups.${exercise.muscleGroup.toLowerCase()}`, {
                      defaultValue: exercise.muscleGroup,
                    })}
                  </AppText>
                </View>
                <View
                  style={{ backgroundColor: colors.brand.surfaceAlt + '80' }}
                  className="flex-row items-center rounded-full px-3 py-1"
                >
                  <Ionicons
                    name={exercise.exercisePrivate ? 'lock-closed' : 'globe-outline'}
                    size={14}
                    color={
                      exercise.exercisePrivate
                        ? colors.status.dangerLight
                        : colors.status.infoLight
                    }
                  />
                  <AppText
                    style={{ color: colors.content.secondary }}
                    className="text-xs ml-1.5"
                  >
                    {exercise.exercisePrivate ? t('exercises.private') : t('exercises.public')}
                  </AppText>
                </View>
              </View>

              <AppText
                weight="bold"
                style={{ color: colors.brand.primary }}
                className="text-3xl font-bold mb-4"
              >
                {exercise.name}
              </AppText>

              {exercise.exerciseOwner && (
                <View className="mb-6 flex-row items-center">
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color={colors.content.secondary}
                  />
                  <AppText
                    style={{ color: colors.content.secondary }}
                    className="ml-2 text-sm"
                  >
                    {t('exercises.createdByYou')}
                  </AppText>
                </View>
              )}

              <AppText
                style={{ color: colors.brand.primary }}
                className="text-base leading-relaxed mb-8"
              >
                {exercise.description}
              </AppText>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
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

                {exercise.exerciseOwner && (
                  <>
                    {onEdit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onEdit(exercise)}
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
                        onPress={() => onDelete(exercise.id)}
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
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
