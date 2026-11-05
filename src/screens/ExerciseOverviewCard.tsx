import AppText from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import type { SessionExercise } from '@/types/session';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';

interface Props {
  item: SessionExercise;
  isActive: boolean;
  exerciseIndex: number;
  drag: () => void;
  onOpenModal: (index: number) => void;
  onRemove: (index: number, name: string) => void;
}

export default function ExerciseOverviewCard({
  item,
  isActive,
  exerciseIndex,
  drag,
  onOpenModal,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const totalSets = item.sets.length;
  const completedSets = item.sets.filter((s) => s.completed).length;
  const allCompleted = totalSets > 0 && completedSets === totalSets;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onOpenModal(exerciseIndex)}
      style={{
        backgroundColor: colors.brand.surface,
        borderColor: isActive
          ? colors.status.info
          : allCompleted
          ? colors.status.info + '40'
          : colors.brand.surfaceBorder,
      }}
      className={`rounded-2xl p-5 mb-4 border ${
        isActive ? 'shadow-xl' : allCompleted ? 'opacity-90' : ''
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          {/* Drag Handle */}
          <TouchableOpacity
            onLongPress={drag}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              backgroundColor: colors.brand.surfaceAlt,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="w-12 h-12 rounded-xl items-center justify-center mr-4 border"
          >
            <Ionicons name="reorder-two-outline" size={24} color={colors.content.secondary} />
          </TouchableOpacity>

          <View className="flex-1">
            <AppText
              weight="bold"
              style={{ color: colors.brand.primary }}
              className="text-lg font-bold"
              numberOfLines={1}
            >
              {item.name}
            </AppText>
            <View className="flex-row items-center mt-1.5">
              {allCompleted ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={colors.status.infoLight} />
                  <AppText
                    weight="semibold"
                    style={{ color: colors.status.infoLight }}
                    className="text-sm font-semibold ml-1.5"
                  >
                    {t('activeWorkout.allSetsCompleted', { total: totalSets })}
                  </AppText>
                </>
              ) : completedSets > 0 ? (
                <>
                  <Ionicons name="pie-chart-outline" size={16} color={colors.brand.primary} />
                  <AppText
                    style={{ color: colors.content.secondary }}
                    className="text-sm font-medium ml-1.5"
                  >
                    {t('activeWorkout.setsProgress', {
                      completed: completedSets,
                      total: totalSets,
                    })}
                  </AppText>
                </>
              ) : (
                <>
                  <Ionicons name="play-circle-outline" size={16} color={colors.content.muted} />
                  <AppText
                    style={{ color: colors.content.muted }}
                    className="text-sm font-medium ml-1.5"
                  >
                    {t('activeWorkout.tapToStart')}
                  </AppText>
                </>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center">
          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => onRemove(exerciseIndex, item.name)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="p-3 mr-1"
          >
            <Ionicons name="trash-outline" size={20} color={colors.status.danger} />
          </TouchableOpacity>

          {/* Chevron */}
          <View
            style={{
              backgroundColor: colors.brand.surfaceAlt,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="w-10 h-10 rounded-full items-center justify-center border"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.content.secondary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
