import { workoutApi } from '@/api/workoutApi';
import AppText from '@/components/common/AppText';
import type { DayOfWeek, RoutineSummary } from '@/features/workouts/types';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Weekly day helpers ─────────────────────────────────────────────────────────

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

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
  const { colors } = useTheme();
  const { t } = useTranslation();
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
    const fallbackName = todayProgramDay?.routineName || t('home.todayWorkout');

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
  }, [todayRoutineId, todayRoutineDetailData, todayProgramDay?.routineName, routines, t]);

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

    const routineName =
      todayRoutineDetail?.name || todayProgramDay?.routineName || t('home.todayWorkout');
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
    t,
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

    startSession(null, t('home.freestyleWorkout'), []);
    router.push('/active-workout');
  }, [activeSession, startSession, router, t]);

  // ── Render helpers ────────────────────────────────────────────────────────

  /** Weekly progress strip */
  const renderWeekStrip = () => (
    <View className="flex-row justify-between mb-8">
      {WEEK_DAY_KEYS.map((key, idx) => {
        const isToday = idx === currentDayIdx;
        const label = t(`home.weekDays.${key}`);
        return (
          <View key={key} className="items-center flex-1">
            <View
              style={{
                backgroundColor: isToday ? colors.brand.primary : colors.brand.surfaceAlt,
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <AppText
                weight="bold"
                style={{
                  color: isToday ? colors.brand.background : colors.content.secondary,
                }}
                className="text-xs font-semibold"
              >
                {label}
              </AppText>
            </View>
            {/* Scheduled-workout dot indicator */}
            {scheduledDays.has(idx) && (
              <View
                style={{
                  backgroundColor: isToday ? colors.brand.primary : colors.content.tertiary,
                }}
                className="w-1.5 h-1.5 rounded-full mt-1.5"
              />
            )}
          </View>
        );
      })}
    </View>
  );

  /** Today's Training card (workout scheduled) */
  const renderTodayWorkout = () => {
    const routineName =
      todayRoutineDetail?.name || todayProgramDay?.routineName || t('home.scheduledWorkout');
    const exercisesText = todayRoutineDetail?.exerciseCount
      ? `${todayRoutineDetail.exerciseCount} ${t('home.exercisesCount')} · ~${
          todayRoutineDetail.estimatedMinutes ?? 45
        } min`
      : t('home.scheduledForToday');

    return (
      <View
        style={{
          backgroundColor: colors.brand.surface,
          borderColor: colors.brand.surfaceBorder,
        }}
        className="rounded-3xl p-6 mb-10 border"
      >
        <View className="flex-row items-center mb-3">
          <View
            style={{ backgroundColor: colors.brand.surfaceAlt }}
            className="rounded-full p-2 mr-3"
          >
            <Ionicons name="flash-outline" size={18} color={colors.brand.primary} />
          </View>
          <AppText
            style={{ color: colors.content.secondary }}
            className="text-sm font-medium tracking-wide uppercase"
          >
            {t('home.todaysTraining')}
          </AppText>
        </View>

        <AppText
          weight="bold"
          style={{ color: colors.content.primary }}
          className="text-2xl font-bold mb-1"
          numberOfLines={1}
        >
          {routineName}
        </AppText>
        <AppText
          style={{ color: colors.content.secondary }}
          className="text-base mb-6"
        >
          {exercisesText}
        </AppText>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleStartTodayWorkout}
          style={{ backgroundColor: colors.brand.primary }}
          className="rounded-xl py-4 flex-row items-center justify-center"
        >
          <Ionicons name="play" size={16} color={colors.brand.background} />
          <AppText
            weight="bold"
            style={{ color: colors.brand.background }}
            className="text-base font-semibold ml-2"
          >
            {t('home.startWorkout')}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  };

  /** Rest-day motivational card */
  const renderRestDay = () => (
    <View
      style={{
        backgroundColor: colors.brand.surface,
        borderColor: colors.brand.surfaceBorder,
      }}
      className="rounded-3xl p-6 mb-10 border items-center"
    >
      <View
        style={{ backgroundColor: colors.brand.surfaceAlt }}
        className="rounded-full p-4 mb-4"
      >
        <Ionicons name="moon-outline" size={28} color={colors.brand.primary} />
      </View>
      <AppText
        weight="bold"
        style={{ color: colors.content.primary }}
        className="text-2xl font-bold mb-1"
      >
        {t('home.restDay')}
      </AppText>
      <AppText
        style={{ color: colors.content.secondary }}
        className="text-base text-center mb-6"
      >
        {t('home.restDaySubtitle')}
      </AppText>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleStartFreestyle}
        style={{
          backgroundColor: colors.brand.surfaceAlt,
          borderColor: colors.brand.surfaceBorder,
        }}
        className="rounded-xl py-4 px-8 flex-row items-center justify-center border"
      >
        <Ionicons name="barbell-outline" size={16} color={colors.brand.primary} />
        <AppText
          weight="bold"
          style={{ color: colors.content.primary }}
          className="text-base font-semibold ml-2"
        >
          {t('home.startFreestyle')}
        </AppText>
      </TouchableOpacity>
    </View>
  );

  /** Loading state for today's card to avoid flickering */
  const renderTodayLoading = () => (
    <View
      style={{
        backgroundColor: colors.brand.surface,
        borderColor: colors.brand.surfaceBorder,
      }}
      className="rounded-3xl p-8 mb-10 border items-center justify-center min-h-[200px]"
    >
      <ActivityIndicator size="small" color={colors.brand.primary} />
      <AppText
        style={{ color: colors.content.secondary }}
        className="text-sm mt-3"
      >
        {t('home.loadingWorkout')}
      </AppText>
    </View>
  );

  /** Prominent card for the last-created routine */
  const renderLastCreatedCard = (routine: RoutineSummary) => (
    <View
      style={{
        backgroundColor: colors.brand.surface,
        borderColor: colors.brand.surfaceBorder,
      }}
      className="rounded-3xl p-6 mb-4 border"
    >
      <View className="flex-row items-center mb-3">
        <View
          style={{ backgroundColor: colors.brand.surfaceAlt }}
          className="rounded-full p-2 mr-3"
        >
          <Ionicons name="flash-outline" size={18} color={colors.brand.primary} />
        </View>
        <AppText
          style={{ color: colors.content.secondary }}
          className="text-sm font-medium tracking-wide uppercase"
        >
          {t('home.lastCreatedRoutine')}
        </AppText>
      </View>
      <AppText
        weight="bold"
        style={{ color: colors.content.primary }}
        className="text-2xl font-bold mb-1"
        numberOfLines={1}
      >
        {routine.name}
      </AppText>
      <AppText
        style={{ color: colors.content.secondary }}
        className="text-base mb-6"
      >
        {routine.createdAt
          ? t('home.createdOn', { date: new Date(routine.createdAt).toLocaleDateString() })
          : ''}
      </AppText>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleStartLastCreated(routine)}
        style={{ backgroundColor: colors.brand.primary }}
        className="rounded-xl py-4 flex-row items-center justify-center"
      >
        <Ionicons name="play" size={16} color={colors.brand.background} />
        <AppText
          weight="bold"
          style={{ color: colors.brand.background }}
          className="text-base font-semibold ml-2"
        >
          {t('home.start')}
        </AppText>
      </TouchableOpacity>
    </View>
  );

  /** Compact list item for remaining routines */
  const renderRoutineItem = (routine: RoutineSummary) => (
    <View
      key={routine.id}
      style={{
        backgroundColor: colors.brand.surface,
        borderColor: colors.brand.surfaceBorder,
      }}
      className="rounded-2xl p-5 mb-4 border"
    >
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: colors.brand.surfaceAlt }}
          className="rounded-xl p-3 mr-4"
        >
          <Ionicons name="barbell-outline" size={22} color={colors.brand.primary} />
        </View>
        <View className="flex-1 justify-center">
          <AppText
            weight="bold"
            style={{ color: colors.content.primary }}
            className="text-lg font-semibold"
            numberOfLines={1}
          >
            {routine.name}
          </AppText>
          <AppText
            style={{ color: colors.content.secondary }}
            className="text-sm mt-1"
          >
            {routine.routinePrivate ? t('home.privateRoutine') : t('home.publicRoutine')}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.content.tertiary} />
      </View>
    </View>
  );

  /** Empty-state with actionable buttons */
  const renderEmptyState = () => (
    <View className="items-center mt-10 px-4">
      <View
        style={{ backgroundColor: colors.brand.surfaceAlt }}
        className="rounded-full p-5 mb-5"
      >
        <Ionicons name="barbell-outline" size={40} color={colors.content.tertiary} />
      </View>

      <AppText
        weight="bold"
        style={{ color: colors.content.primary }}
        className="text-xl font-bold mb-2"
      >
        {t('home.noRoutinesTitle')}
      </AppText>
      <AppText
        style={{ color: colors.content.secondary }}
        className="text-base text-center mb-8"
      >
        {t('home.noRoutinesSubtitle')}
      </AppText>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/routines')}
        style={{
          backgroundColor: colors.brand.surfaceAlt,
          borderColor: colors.brand.surfaceBorder,
        }}
        className="rounded-xl py-4 px-8 flex-row items-center justify-center border mb-3 w-full"
      >
        <Ionicons name="search-outline" size={16} color={colors.brand.primary} />
        <AppText
          weight="bold"
          style={{ color: colors.brand.primary }}
          className="text-base font-semibold ml-2"
        >
          {t('home.browseCatalog')}
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/routines')}
        style={{ backgroundColor: colors.brand.primary }}
        className="rounded-xl py-4 px-8 flex-row items-center justify-center w-full"
      >
        <Ionicons name="add-circle-outline" size={16} color={colors.brand.background} />
        <AppText
          weight="bold"
          style={{ color: colors.brand.background }}
          className="text-base font-semibold ml-2"
        >
          {t('home.createFirstRoutine')}
        </AppText>
      </TouchableOpacity>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1"
      edges={['top']}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-8">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <View className="mt-4 mb-6">
            <AppText
              style={{ color: colors.content.secondary }}
              className="text-base"
            >
              {t('home.greeting', { name: userName || 'Athlete' })}
            </AppText>
            <AppText
              weight="bold"
              style={{ color: colors.content.primary }}
              className="text-3xl font-bold mt-1"
            >
              {t('home.readyToTrain')}
            </AppText>
          </View>

          {/* ── Active Workout Resume Banner ────────────────────────────── */}
          {activeSession && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/active-workout')}
              style={{
                backgroundColor: colors.status.info + '15',
                borderColor: colors.status.info + '40',
              }}
              className="border rounded-2xl p-4 mb-6 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  style={{ backgroundColor: colors.status.info + '20' }}
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                >
                  <Ionicons name="pulse" size={20} color={colors.status.infoLight} />
                </View>
                <View className="flex-1">
                  <AppText
                    weight="bold"
                    style={{ color: colors.status.infoLight }}
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    {t('home.workoutInProgress')}
                  </AppText>
                  <AppText
                    weight="bold"
                    style={{ color: colors.brand.primary }}
                    className="text-base font-bold"
                    numberOfLines={1}
                  >
                    {activeSession.name}
                  </AppText>
                </View>
              </View>
              <View
                style={{ backgroundColor: colors.status.info }}
                className="py-2 px-3.5 rounded-xl flex-row items-center"
              >
                <AppText
                  weight="bold"
                  style={{ color: colors.content.primary }}
                  className="text-xs font-bold mr-1"
                >
                  {t('home.resume')}
                </AppText>
                <Ionicons name="arrow-forward" size={12} color={colors.content.primary} />
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
            <ActivityIndicator className="mt-10" color={colors.brand.primary} size="large" />
          ) : routines.length > 0 ? (
            <>
              <AppText
                weight="bold"
                style={{ color: colors.content.primary }}
                className="text-xl font-semibold mb-4"
              >
                {t('home.recentRoutines')}
              </AppText>

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
