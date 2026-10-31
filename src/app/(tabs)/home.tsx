import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';

// ─── Types ──────────────────────────────────────────────────────────────────────

type RoutineSummary = {
  id: string;
  name: string;
  routinePrivate: boolean;
  createdBy: string;
  createdAt: string;
};

// ─── Weekly day helpers ─────────────────────────────────────────────────────────

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** JS getDay() is 0=Sun … 6=Sat → remap to 0=Mon … 6=Sun */
function todayIndex(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

/** Mock: indices (0-based Mon–Sun) that have a scheduled workout dot. */
const MOCK_SCHEDULED_DAYS = new Set([0, 2, 4]); // Mon, Wed, Fri

// ─── Component ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Mock state: toggle to `false` to preview the rest-day card
  const [hasWorkoutToday] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadUserData = useCallback(async () => {
    try {
      let name: string | null = null;
      if (Platform.OS === 'web') {
        name = localStorage.getItem('user_name');
      } else {
        name = await SecureStore.getItemAsync('user_name');
      }
      if (name) setUserName(name);
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  }, []);

  const fetchWorkouts = useCallback(async () => {
    try {
      const response = await axiosClient.get('/workouts/routines', {
        params: { page: 0, size: 5, mineOnly: true },
      });
      setRoutines(response.data.content ?? []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      Alert.alert('Error', 'Your routines could not be fetched.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    fetchWorkouts();
  }, [loadUserData, fetchWorkouts]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const currentDayIdx = useMemo(() => todayIndex(), []);
  const firstRoutine = routines[0] ?? null;
  const remainingRoutines = routines.slice(1);

  // ── Render helpers ────────────────────────────────────────────────────────

  /** Weekly progress strip */
  const renderWeekStrip = () => (
    <View className="flex-row justify-between mb-8">
      {WEEK_DAYS.map((label, idx) => {
        const isToday = idx === currentDayIdx;
        return (
          <View key={label} className="items-center flex-1">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${isToday ? 'bg-brand-primary' : 'bg-brand-surfaceAlt'
                }`}
            >
              <Text
                className={`text-xs font-semibold ${isToday ? 'text-brand-background' : 'text-content-secondary'
                  }`}
              >
                {label}
              </Text>
            </View>
            {/* Scheduled-workout dot indicator */}
            {MOCK_SCHEDULED_DAYS.has(idx) && (
              <View
                className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isToday ? 'bg-brand-primary' : 'bg-content-tertiary'
                  }`}
              />
            )}
          </View>
        );
      })}
    </View>
  );

  /** Today's Training card (workout scheduled) */
  const renderTodayWorkout = () => (
    <View className="bg-brand-surface rounded-3xl p-6 mb-10 border border-brand-surfaceBorder">
      <View className="flex-row items-center mb-3">
        <View className="bg-brand-surfaceAlt rounded-full p-2 mr-3">
          <Ionicons name="flash-outline" size={18} color={Colors.brand.primary} />
        </View>
        <Text className="text-content-secondary text-sm font-medium tracking-wide">
          TODAY'S TRAINING
        </Text>
      </View>

      <Text className="text-brand-primary text-2xl font-bold mb-1">
        Hypertrophy · Push A
      </Text>
      <Text className="text-content-secondary text-base mb-6">
        8 exercises · ~55 min
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        className="bg-brand-primary rounded-xl py-4 flex-row items-center justify-center"
      >
        <Ionicons name="play" size={16} color={Colors.brand.background} />
        <Text className="text-brand-background text-base font-semibold ml-2">
          Start Workout
        </Text>
      </TouchableOpacity>
    </View>
  );

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
        className="bg-brand-surfaceAlt rounded-xl py-4 px-8 flex-row items-center justify-center border border-brand-surfaceBorder"
      >
        <Ionicons name="barbell-outline" size={16} color={Colors.brand.primary} />
        <Text className="text-brand-primary text-base font-semibold ml-2">
          Start a Freestyle Workout
        </Text>
      </TouchableOpacity>
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
        Created {new Date(routine.createdAt).toLocaleDateString()}
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
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

          {/* ── Weekly Progress Strip ──────────────────────────────────── */}
          {renderWeekStrip()}

          {/* ── Today's Training / Rest Day ────────────────────────────── */}
          {hasWorkoutToday ? renderTodayWorkout() : renderRestDay()}

          {/* ── Recent Routines ─────────────────────────────────────────── */}
          {loading ? (
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
