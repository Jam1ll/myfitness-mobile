import AppText from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';

interface Props {
  workoutName: string;
  elapsedTime: string;
  exerciseCount: number;
  onDiscard: () => void;
  onAddExercise: () => void;
}

export default function WorkoutHeader({
  workoutName,
  elapsedTime,
  exerciseCount,
  onDiscard,
  onAddExercise,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{ borderBottomColor: colors.brand.surfaceBorder }}
      className="px-5 pt-4 pb-5 border-b"
    >
      <View className="flex-row items-center justify-between mb-4">
        {/* Discard Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDiscard}
          style={{
            backgroundColor: colors.status.danger + '15',
            borderColor: colors.status.danger + '30',
          }}
          className="flex-row items-center py-2.5 px-4 rounded-xl border"
        >
          <Ionicons name="trash-outline" size={18} color={colors.status.danger} />
          <AppText
            weight="bold"
            style={{ color: colors.status.danger }}
            className="text-sm font-bold ml-2"
          >
            {t('activeWorkout.discard')}
          </AppText>
        </TouchableOpacity>

        {/* Global Stopwatch */}
        <View
          style={{
            backgroundColor: colors.brand.surfaceAlt,
            borderColor: colors.brand.surfaceBorder,
          }}
          className="flex-row items-center px-4 py-2 rounded-full border"
        >
          <Ionicons name="time-outline" size={18} color={colors.status.infoLight} />
          <AppText
            weight="bold"
            style={{ color: colors.brand.primary }}
            className="text-sm font-bold ml-2 font-mono"
          >
            {elapsedTime}
          </AppText>
        </View>

        {/* Add Exercise Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAddExercise}
          style={{
            backgroundColor: colors.brand.surfaceAlt,
            borderColor: colors.brand.surfaceBorder,
          }}
          className="flex-row items-center py-2.5 px-4 rounded-xl border"
        >
          <Ionicons name="add" size={20} color={colors.brand.primary} />
          <AppText
            weight="bold"
            style={{ color: colors.brand.primary }}
            className="text-sm font-bold ml-1"
          >
            {t('activeWorkout.add')}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Routine Title & Subtitle */}
      <AppText
        weight="bold"
        style={{ color: colors.brand.primary }}
        className="text-3xl font-black"
        numberOfLines={1}
      >
        {workoutName || t('activeWorkout.defaultSessionName')}
      </AppText>
      <AppText
        style={{ color: colors.content.secondary }}
        className="text-sm mt-1.5 font-medium"
      >
        {t('activeWorkout.exercisesCountFocusMode', { count: exerciseCount })}
      </AppText>
    </View>
  );
}
