import { workoutApi } from '@/api/workoutApi';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import type { DayOfWeek, RoutineSummary } from '@/features/workouts/types';
import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Weekly day helpers ─────────────────────────────────────────────────────────

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const INDEX_TO_DAY_OF_WEEK: Record<number, DayOfWeek> = {
  0: 'MONDAY',
  1: 'TUESDAY',
  2: 'WEDNESDAY',
  3: 'THURSDAY',
  4: 'FRIDAY',
  5: 'SATURDAY',
  6: 'SUNDAY',
};

const DAY_OF_WEEK_TO_INDEX: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/** JS getDay() is 0=Sun … 6=Sat → remap to 0=Mon … 6=Sun */
function todayIndex(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  // ── Workout Store ─────────────────────────────────────────────────────────
  const startSession = useWorkoutStore((s) => s.startSession);
  const activeSession = useWorkoutStore((s) => s.activeSession);

  // ── User Data (Local auth info) ───────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let name: string | null = null;
        if (Platform.OS === 'web') {
          name = localStorage.getItem('user_name');
        } else {
          name = await SecureStore.getItemAsync('user_name');
        }
        if (isMounted && name) {
          setUserName(name);
        }
      } catch (error) {
        console.error('Error loading user name:', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Queries ───────────────────────────────────────────────────────────────

  // Query: User's personal routines
  const { data: routinesPage, isLoading: isLoadingRoutines } = useQuery({
    queryKey: ['routines', 'mine'],
    queryFn: () => workoutApi.getRoutines({ page: 0, size: 5, mineOnly: true }),
  });
  const routines = useMemo<RoutineSummary[]>(() => routinesPage?.content ?? [], [routinesPage]);

  // Query: Active weekly program
  const { data: activeProgram, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['programs', 'active'],
    queryFn: async () => {
      try {
        const directRes = await workoutApi.getActiveProgram();
        if (directRes && directRes.weeklyProgramActive !== false) {
          return directRes;
        }
      } catch {
        // Fallback: search all user programs
        const list = await workoutApi.getPrograms();
        return list.find((p) => p.weeklyProgramActive) ?? null;
      }
      return null;
    },
  });

  // ── Derived data ──────────────────────────────────────────────────────────

  const currentDayIdx = useMemo(() => todayIndex(), []);
  const todayDayOfWeek = useMemo<DayOfWeek>(() => INDEX_TO_DAY_OF_WEEK[currentDayIdx], [currentDayIdx]);

  // Dynamic set of 0-based indices that have a routine assigned
  const scheduledDays = useMemo(() => {
    const daysSet = new Set<number>();
    if (!activeProgram?.programDays) return daysSet;

    activeProgram.programDays.forEach((pd) => {
      if (pd.routineId) {
        const idx = DAY_OF_WEEK_TO_INDEX[pd.dayOfWeek];
        if (idx !== undefined) {
          daysSet.add(idx);
        }
      }
    });

    return daysSet;
  }, [activeProgram]);

  // Today's assigned program day
  const todayProgramDay = useMemo(() => {
    if (!activeProgram?.programDays) return null;
    return (
      activeProgram.programDays.find(
        (pd) => pd.dayOfWeek === todayDayOfWeek && Boolean(pd.routineId),
      ) ?? null
    );
  }, [activeProgram, todayDayOfWeek]);

  const hasWorkoutToday = Boolean(todayProgramDay?.routineId);
  const todayRoutineId = todayProgramDay?.routineId;

  // Query: Today's routine detail (only runs if a routine is scheduled today)
  const { data: todayRoutineDetailData } = useQuery({
    queryKey: ['routines', 'detail', todayRoutineId],
    queryFn: () => workoutApi.getRoutineById(todayRoutineId!),
    enabled: Boolean(todayRoutineId),
  });

  const todayRoutineDetail = useMemo(() => {
    if (!todayRoutineId) return null;
    const fallbackName = todayProgramDay?.routineName || 'Today Workout';

    if (todayRoutineDetailData) {
      const exercises = todayRoutineDetailData.enrichedRoutineExercises ?? [];
      const count = exercises.length;
      const estimatedMins = count > 0 ? Math.max(20, count * 7) : undefined;
      return {
        name: todayRoutineDetailData.name || fallbackName,
        exerciseCount: count,
        estimatedMinutes: estimatedMins,
      };
    }

    const routineFromList = routines.find((r) => r.id === todayRoutineId);
    return {
      name: routineFromList?.name || fallbackName,
    };
  }, [todayRoutineId, todayRoutineDetailData, todayProgramDay?.routineName, routines]);

  const firstRoutine = routines[0] ?? null;
  const remainingRoutines = routines.slice(1);

  // ── Workout Navigation Handlers ───────────────────────────────────────────

  const handleStartTodayWorkout = useCallback(async () => {
    if (activeSession) {
      router.push('/active-workout');
      return;
    }

    if (!todayRoutineId) return;

    let exercises: Array<{ exerciseId: string; name: string }> = [];
    if (todayRoutineDetailData?.enrichedRoutineExercises?.length) {
      exercises = todayRoutineDetailData.enrichedRoutineExercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
      }));
    } else {
      try {
        const full = await workoutApi.getRoutineById(todayRoutineId);
        exercises = (full.enrichedRoutineExercises ?? []).map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
        }));
      } catch (e) {
        console.error('Error fetching today routine exercises:', e);
      }
    }

    const routineName = todayRoutineDetail?.name || todayProgramDay?.routineName || 'Today Workout';
    startSession(todayRoutineId, routineName, exercises);
    router.push('/active-workout');
  }, [
    activeSession,
    todayRoutineId,
    todayRoutineDetailData,
    todayRoutineDetail?.name,
    todayProgramDay?.routineName,
    startSession,
    router,
  ]);

  const handleStartLastCreated = useCallback(
    async (routine: RoutineSummary) => {
      if (activeSession) {
        router.push('/active-workout');
        return;
      }

      try {
        const full = await workoutApi.getRoutineById(routine.id);
        const exercises = (full.enrichedRoutineExercises ?? []).map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
        }));
        startSession(routine.id, routine.name, exercises);
        router.push('/active-workout');
      } catch (e) {
        console.error('Error fetching routine exercises:', e);
        startSession(routine.id, routine.name, []);
        router.push('/active-workout');
      }
    },
    [activeSession, startSession, router],
  );

  const handleStartFreestyle = useCallback(() => {
    if (activeSession) {
      router.push('/active-workout');
      return;
    }

    startSession(null, 'Freestyle Workout', []);
    router.push('/active-workout');
  }, [activeSession, startSession, router]);

  // ── Render helpers ────────────────────────────────────────────────────────

  /** Weekly progress strip */
  const renderWeekStrip = () => (
    <View className="flex-row justify-between mb-8">
      {WEEK_DAYS.map((label, idx) => {
        const isToday = idx === currentDayIdx;
        return (
          <View key={label} className="items-center flex-1">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isToday ? 'bg-brand-primary' : 'bg-brand-surfaceAlt'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isToday ? 'text-brand-background' : 'text-content-secondary'
                }`}
              >
                {label}
              </Text>
            </View>
            {/* Scheduled-workout dot indicator */}
            {scheduledDays.has(idx) && (
              <View
                className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  isToday ? 'bg-brand-primary' : 'bg-content-tertiary'
                }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );

  /** Today's Training card (workout scheduled) */
  const renderTodayWorkout = () => {
    const routineName = todayRoutineDetail?.name || todayProgramDay?.routineName || 'Scheduled Workout';
    const exercisesText = todayRoutineDetail?.exerciseCount
      ? `${todayRoutineDetail.exerciseCount} exercises · ~${todayRoutineDetail.estimatedMinutes ?? 45} min`
      : 'Scheduled for today';

    return (
      <View className="bg-brand-surface rounded-3xl p-6 mb-10 border border-brand-surfaceBorder">
        <View className="flex-row items-center mb-3">
          <View className="bg-brand-surfaceAlt rounded-full p-2 mr-3">
            <Ionicons name="flash-outline" size={18} color={Colors.brand.primary} />
          </View>
          <Text className="text-content-secondary text-sm font-medium tracking-wide">
            TODAY&apos;S TRAINING
          </Text>
        </View>

        <Text className="text-brand-primary text-2xl font-bold mb-1" numberOfLines={1}>
          {routineName}
        </Text>
        <Text className="text-content-secondary text-base mb-6">
          {exercisesText}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleStartTodayWorkout}
          className="bg-brand-primary rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="play" size={16} color={Colors.brand.background} />
          <Text className="text-brand-background text-base font-semibold ml-2">
            Start Workout
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /** Rest-day motivational card */
  const renderRestDay = () => (
    <View className="bg-brand-surface rounded-3xl p-6 mb-10 border border-brand-surfaceBorder items-center">
      <View className="bg-brand-surfaceAlt rounded-full p-4 mb-4">
        <Ionicons name="moon-outline" size={28} color={Colors.brand.primary} />
      </View>
      <Text className="text-brand-primary text-2xl font-bold mb-1">Rest Day</Text>
      <Text className="text-content-secondary text-base text-center mb-6">
        Recovery is part of progress.{'\n'}Take it easy and come back stronger.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleStartFreestyle}
        className="bg-brand-surfaceAlt rounded-xl py-4 px-8 flex-row items-center justify-center border border-brand-surfaceBorder"
      >
        <Ionicons name="barbell-outline" size={16} color={Colors.brand.primary} />
        <Text className="text-brand-primary text-base font-semibold ml-2">
          Start a Freestyle Workout
        </Text>
      </TouchableOpacity>
    </View>
  );

  /** Loading state for today's card to avoid flickering */
  const renderTodayLoading = () => (
    <View className="bg-brand-surface rounded-3xl p-8 mb-10 border border-brand-surfaceBorder items-center justify-center min-h-[200px]">
      <ActivityIndicator size="small" color={Colors.brand.primary} />
      <Text className="text-content-secondary text-sm mt-3">Loading today&apos;s workout...</Text>
    </View>
  );

  /** Prominent card for the last-created routine */
  const renderLastCreatedCard = (routine: RoutineSummary) => (
    <View className="bg-brand-surface rounded-3xl p-6 mb-4 border border-brand-surfaceBorder">
      <View className="flex-row items-center mb-3">
        <View className="bg-brand-surfaceAlt rounded-full p-2 mr-3">
          <Ionicons name="flash-outline" size={18} color={Colors.brand.primary} />
        </View>
        <Text className="text-content-secondary text-sm font-medium tracking-wide">
          LAST CREATED ROUTINE
        </Text>
      </View>
      <Text className="text-brand-primary text-2xl font-bold mb-1" numberOfLines={1}>
        {routine.name}
      </Text>
      <Text className="text-content-secondary text-base mb-6">
        Created {routine.createdAt ? new Date(routine.createdAt).toLocaleDateString() : ''}
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleStartLastCreated(routine)}
        className="bg-brand-primary rounded-xl py-4 flex-row items-center justify-center"
      >
        <Ionicons name="play" size={16} color={Colors.brand.background} />
        <Text className="text-brand-background text-base font-semibold ml-2">
          Start
        </Text>
      </TouchableOpacity>
    </View>
  );

  /** Compact list item for remaining routines */
  const renderRoutineItem = (routine: RoutineSummary) => (
    <View
      key={routine.id}
      className="bg-brand-surface rounded-2xl p-5 mb-4 border border-brand-surfaceBorder"
    >
      <View className="flex-row items-start">
        <View className="bg-brand-surfaceAlt rounded-xl p-3 mr-4">
          <Ionicons name="barbell-outline" size={22} color={Colors.brand.primary} />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-brand-primary text-lg font-semibold" numberOfLines={1}>
            {routine.name}
          </Text>
          <Text className="text-content-secondary text-sm mt-1">
            {routine.routinePrivate ? 'Private' : 'Public'} routine
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.content.tertiary} />
      </View>
    </View>
  );

  /** Empty-state with actionable buttons */
  const renderEmptyState = () => (
    <View className="items-center mt-10 px-4">
      <View className="bg-brand-surfaceAlt rounded-full p-5 mb-5">
        <Ionicons name="barbell-outline" size={40} color={Colors.content.tertiary} />
      </View>

      <Text className="text-brand-primary text-xl font-bold mb-2">No routines yet</Text>
      <Text className="text-content-secondary text-base text-center mb-8">
        Create your first routine or browse the catalog to get started on your fitness
        journey.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/routines')}
        className="bg-brand-surfaceAlt rounded-xl py-4 px-8 flex-row items-center justify-center border border-brand-surfaceBorder mb-3 w-full"
      >
        <Ionicons name="search-outline" size={16} color={Colors.brand.primary} />
        <Text className="text-brand-primary text-base font-semibold ml-2">
          Browse Catalog
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/routines')}
        className="bg-brand-primary rounded-xl py-4 px-8 flex-row items-center justify-center w-full"
      >
        <Ionicons name="add-circle-outline" size={16} color={Colors.brand.background} />
        <Text className="text-brand-background text-base font-semibold ml-2">
          Create My First Routine
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-8">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <View className="mt-4 mb-6">
            <Text className="text-content-secondary text-base">
              Hello, {userName || 'User'}
            </Text>
            <Text className="text-brand-primary text-3xl font-bold mt-1">
              Ready to train
            </Text>
          </View>

          {/* ── Active Workout Resume Banner ────────────────────────────── */}
          {activeSession && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/active-workout')}
              className="bg-status-info/15 border border-status-info/40 rounded-2xl p-4 mb-6 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-10 h-10 rounded-full bg-status-info/20 items-center justify-center mr-3">
                  <Ionicons name="pulse" size={20} color={Colors.status.infoLight} />
                </View>
                <View className="flex-1">
                  <Text className="text-status-infoLight text-xs font-bold uppercase tracking-wider">
                    Entrenamiento en curso
                  </Text>
                  <Text className="text-brand-primary text-base font-bold" numberOfLines={1}>
                    {activeSession.name}
                  </Text>
                </View>
              </View>
              <View className="bg-status-info py-2 px-3.5 rounded-xl flex-row items-center">
                <Text className="text-white text-xs font-bold mr-1">Reanudar</Text>
                <Ionicons name="arrow-forward" size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}

          {/* ── Weekly Progress Strip ──────────────────────────────────── */}
          {renderWeekStrip()}

          {/* ── Today's Training / Rest Day ────────────────────────────── */}
          {isLoadingProgram
            ? renderTodayLoading()
            : hasWorkoutToday
              ? renderTodayWorkout()
              : renderRestDay()}

          {/* ── Recent Routines ─────────────────────────────────────────── */}
          {isLoadingRoutines ? (
            <ActivityIndicator className="mt-10" color={Colors.brand.primary} size="large" />
          ) : routines.length > 0 ? (
            <>
              <Text className="text-brand-primary text-xl font-semibold mb-4">
                Recent Routines
              </Text>

              {firstRoutine && renderLastCreatedCard(firstRoutine)}

              {remainingRoutines.map((routine) => renderRoutineItem(routine))}
            </>
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
