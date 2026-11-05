import { catalogApi } from '@/api/catalogApi';
import AppText from '@/components/common/AppText';
import ActiveExerciseModal from '@/features/workouts/components/ActiveExerciseModal';
import ExerciseSelectorModal from '@/features/workouts/components/ExerciseSelectorModal';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useTheme } from '@/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExerciseOverviewCard from './ExerciseOverviewCard';
import WorkoutHeader from './WorkoutHeader';

function formatElapsedTime(startTimeISO: string): string {
  const start = new Date(startTimeISO).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const activeSession = useWorkoutStore((s) => s.activeSession);
  const isResting = useWorkoutStore((s) => s.isResting);
  const restTimeRemaining = useWorkoutStore((s) => s.restTimeRemaining);

  const reorderExercises = useWorkoutStore((s) => s.reorderExercises);
  const addExerciseToSession = useWorkoutStore((s) => s.addExerciseToSession);
  const removeExerciseFromSession = useWorkoutStore((s) => s.removeExerciseFromSession);
  const cancelSession = useWorkoutStore((s) => s.cancelSession);
  const completeSession = useWorkoutStore((s) => s.completeSession);
  const setIsResting = useWorkoutStore((s) => s.setIsResting);
  const setRestTimeRemaining = useWorkoutStore((s) => s.setRestTimeRemaining);

  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!activeSession?.startTime) return;
    setElapsedTime(formatElapsedTime(activeSession.startTime));
    const timer = setInterval(
      () => setElapsedTime(formatElapsedTime(activeSession.startTime)),
      1000,
    );
    return () => clearInterval(timer);
  }, [activeSession?.startTime]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isResting && restTimeRemaining > 0) {
      interval = setInterval(() => setRestTimeRemaining(restTimeRemaining - 1), 1000);
    } else if (isResting && restTimeRemaining <= 0) {
      setIsResting(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTimeRemaining, setIsResting, setRestTimeRemaining]);

  const handleConfirmAddExercises = async (ids: string[]) => {
    setIsSelectorVisible(false);

    const existingIds = new Set(activeSession?.exercises.map((e) => e.exerciseId));
    const newIds = ids.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) return;

    requestAnimationFrame(async () => {
      try {
        const res = await catalogApi.getExercises({ size: 100 });
        const catalogMap = new Map(res.content.map((item) => [item.id, item.name]));
        newIds.forEach((id) =>
          addExerciseToSession({ exerciseId: id, name: catalogMap.get(id) || 'Exercise' }),
        );
      } catch {
        newIds.forEach((id) => addExerciseToSession({ exerciseId: id, name: 'Exercise' }));
      }
    });
  };

  const handleFinishWorkout = async () => {
    if (isFinishing) return;

    setIsFinishing(true);

    try {
      await completeSession();

      Alert.alert(t('activeWorkout.completedTitle'), t('activeWorkout.completedMessage'), [
        {
          text: t('common.done'),
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]);
    } catch {
      Alert.alert(t('activeWorkout.offlineTitle'), t('activeWorkout.offlineMessage'), [
        {
          text: t('common.gotIt'),
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]);
    } finally {
      setIsFinishing(false);
    }
  };

  if (!activeSession) {
    return (
      <SafeAreaView
        style={{ backgroundColor: colors.brand.background }}
        className="flex-1 justify-center items-center px-6"
      >
        <AppText
          weight="bold"
          style={{ color: colors.brand.primary }}
          className="text-xl font-bold"
        >
          {t('activeWorkout.noActiveWorkout')}
        </AppText>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={{ backgroundColor: colors.brand.primary }}
          className="mt-6 py-3 px-8 rounded-xl"
        >
          <AppText
            weight="bold"
            style={{ color: colors.brand.background }}
            className="font-bold"
          >
            {t('activeWorkout.returnHome')}
          </AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const nextExerciseName =
    selectedExerciseIndex !== null && selectedExerciseIndex < activeSession.exercises.length - 1
      ? activeSession.exercises[selectedExerciseIndex + 1]?.name
      : undefined;

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1"
      edges={['top', 'bottom']}
    >
      <WorkoutHeader
        workoutName={activeSession.name}
        elapsedTime={elapsedTime}
        exerciseCount={activeSession.exercises.length}
        onDiscard={() => {
          Alert.alert(t('activeWorkout.discardTitle'), t('activeWorkout.discardMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('activeWorkout.discard'),
              style: 'destructive',
              onPress: () => {
                cancelSession();
                router.replace('/(tabs)/home');
              },
            },
          ]);
        }}
        onAddExercise={() => setIsSelectorVisible(true)}
      />

      <View className="flex-1 px-4 pt-4">
        <DraggableFlatList
          data={activeSession.exercises}
          onDragEnd={({ from, to }) => reorderExercises(from, to)}
          keyExtractor={(item, idx) => `${item.exerciseId}-${idx}`}
          renderItem={({ item, drag, isActive, getIndex }) => (
            <ScaleDecorator>
              <ExerciseOverviewCard
                item={item}
                isActive={isActive}
                exerciseIndex={getIndex() ?? item.orderIndex}
                drag={drag}
                onOpenModal={setSelectedExerciseIndex}
                onRemove={(idx, name) => {
                  Alert.alert(
                    t('activeWorkout.removeTitle'),
                    t('activeWorkout.removeMessage', { name }),
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.delete'),
                        style: 'destructive',
                        onPress: () => removeExerciseFromSession(idx),
                      },
                    ],
                  );
                }}
              />
            </ScaleDecorator>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      <View
        style={{
          borderTopColor: colors.brand.surfaceBorder,
          backgroundColor: colors.brand.surface,
        }}
        className="px-5 py-4 border-t"
      >
        <TouchableOpacity
          onPress={handleFinishWorkout}
          disabled={isFinishing}
          style={{ backgroundColor: colors.brand.primary }}
          className="rounded-2xl py-4 flex-row items-center justify-center"
        >
          {isFinishing ? (
            <ActivityIndicator color={colors.brand.background} />
          ) : (
            <AppText
              weight="bold"
              style={{ color: colors.brand.background }}
              className="text-lg font-bold uppercase tracking-wider"
            >
              {t('activeWorkout.finishWorkout')}
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      {selectedExerciseIndex !== null && (
        <ActiveExerciseModal
          isVisible={selectedExerciseIndex !== null}
          onClose={() => setSelectedExerciseIndex(null)}
          exerciseIndex={selectedExerciseIndex}
          totalExercises={activeSession.exercises.length}
          nextExerciseName={nextExerciseName}
          onSelectNextExercise={() => setSelectedExerciseIndex(selectedExerciseIndex + 1)}
        />
      )}

      <ExerciseSelectorModal
        isVisible={isSelectorVisible}
        onClose={() => setIsSelectorVisible(false)}
        onConfirm={handleConfirmAddExercises}
        initialSelectedIds={activeSession.exercises.map((e) => e.exerciseId)}
      />
    </SafeAreaView>
  );
}
