import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';

import { catalogApi } from '@/api/catalogApi';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Colors } from '@/theme/colors';

import ActiveExerciseModal from '@/features/workouts/components/ActiveExerciseModal';
import ExerciseSelectorModal from '@/features/workouts/components/ExerciseSelectorModal';
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
    const timer = setInterval(() => setElapsedTime(formatElapsedTime(activeSession.startTime)), 1000);
    return () => clearInterval(timer);
  }, [activeSession?.startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimeRemaining > 0) {
      interval = setInterval(() => setRestTimeRemaining(prev => prev - 1), 1000);
    } else if (isResting && restTimeRemaining <= 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeRemaining]);

  const handleConfirmAddExercises = async (ids: string[]) => {
    setIsSelectorVisible(false);

    const existingIds = new Set(activeSession?.exercises.map(e => e.exerciseId));
    const newIds = ids.filter(id => !existingIds.has(id));

    if (newIds.length === 0) return;

    // Liberamos el hilo de la UI para que el modal se cierre antes de actualizar masivamente Zustand
    requestAnimationFrame(async () => {
      try {
        const res = await catalogApi.getExercises({ size: 100 });
        const catalogMap = new Map(res.content.map(item => [item.id, item.name]));
        newIds.forEach(id => addExerciseToSession({ exerciseId: id, name: catalogMap.get(id) || 'Exercise' }));
      } catch {
        newIds.forEach(id => addExerciseToSession({ exerciseId: id, name: 'Exercise' }));
      }
    });
  };


  const handleFinishWorkout = async () => {
    if (isFinishing) return;

    setIsFinishing(true);

    try {
      const success = await completeSession();

      // Si completeSession devuelve false, no mostramos éxito
      // ni redirigimos al usuario.
      if (!success) return;

      Alert.alert(
        'Workout Completed!',
        'Session saved successfully.',
        [
          {
            text: 'Done',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch {
      Alert.alert(
        'Saved Offline',
        'No internet. Saved locally to sync later.',
        [
          {
            text: 'Got it',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } finally {
      setIsFinishing(false);
    }
  };


  if (!activeSession) {
    return (
      <SafeAreaView className="flex-1 bg-brand-background justify-center items-center px-6">
        <Text className="text-brand-primary text-xl font-bold">No Active Workout</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/home')} className="mt-6 bg-brand-primary py-3 px-8 rounded-xl">
          <Text className="text-brand-background font-bold">Return Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const nextExerciseName = selectedExerciseIndex !== null && selectedExerciseIndex < activeSession.exercises.length - 1
    ? activeSession.exercises[selectedExerciseIndex + 1]?.name
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={['top', 'bottom']}>
      <WorkoutHeader
        workoutName={activeSession.name}
        elapsedTime={elapsedTime}
        exerciseCount={activeSession.exercises.length}
        onDiscard={() => { cancelSession(); router.replace('/(tabs)/home'); }}
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
                onRemove={(idx) => removeExerciseFromSession(idx)}
              />
            </ScaleDecorator>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      <View className="px-5 py-4 border-t border-brand-surfaceBorder bg-brand-surface">
        <TouchableOpacity onPress={handleFinishWorkout} disabled={isFinishing} className="bg-brand-primary rounded-2xl py-4 flex-row items-center justify-center">
          {isFinishing ? <ActivityIndicator color={Colors.brand.background} /> : <Text className="text-brand-background text-lg font-bold">FINISH WORKOUT</Text>}
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