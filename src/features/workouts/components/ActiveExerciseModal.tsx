import AppText from '@/components/common/AppText';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExerciseSet } from '@/types/session';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type WeightUnit = 'KG' | 'LBS' | 'BODYWEIGHT';
export type ModalPhase = 'READY' | 'ACTIVE' | 'LOGGING' | 'COMPLETED';

const LB_TO_KG = 0.453592;

interface ActiveExerciseModalProps {
  isVisible: boolean;
  onClose: () => void;
  exerciseIndex: number;
  totalExercises: number;
  nextExerciseName?: string;
  onSelectNextExercise?: () => void;
}

interface SmoothProgressRingProps {
  diameter: number;
  strokeWidth: number;
  progress: SharedValue<number>;
  activeColor: string;
  trackColor: string;
}

function SmoothProgressRing({
  diameter,
  strokeWidth,
  progress,
  activeColor,
  trackColor,
}: SmoothProgressRingProps) {
  const center = diameter / 2;
  const radius = Math.max(1, (diameter - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - Math.max(0, Math.min(1, progress.value))),
  }));

  return (
    <Svg
      width={diameter}
      height={diameter}
      style={{ transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={activeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeLinecap="round"
        fill="transparent"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

function formatStopwatch(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ActiveExerciseModal({
  isVisible,
  onClose,
  exerciseIndex,
  totalExercises,
  nextExerciseName,
  onSelectNextExercise,
}: ActiveExerciseModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const activeSession = useWorkoutStore((s) => s.activeSession);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const addSetToExercise = useWorkoutStore((s) => s.addSetToExercise);
  const setIsResting = useWorkoutStore((s) => s.setIsResting);
  const setRestTimeRemaining = useWorkoutStore((s) => s.setRestTimeRemaining);
  const { width, height } = useWindowDimensions();

  const tutDiameter = Math.min(width * 0.78, height * 0.38, 320);
  const tutFontSize = tutDiameter * 0.18;
  const tutStrokeWidth = Math.max(8, tutDiameter * 0.043);

  const exercise = activeSession?.exercises[exerciseIndex];
  const configuredRest =
    (exercise as { restTimeSeconds?: number } | undefined)?.restTimeSeconds ?? 60;

  const [phase, setPhase] = useState<ModalPhase>('READY');
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [tutSeconds, setTutSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);

  const [weightText, setWeightText] = useState('');
  const [repsText, setRepsText] = useState('');
  const [rpeText, setRpeText] = useState('8');

  const initializedExerciseRef = useRef<number | null>(null);
  const restEndTimeRef = useRef<number | null>(null);

  // Shared values running at 60/120fps on UI thread
  const restProgress = useSharedValue(0);
  const tutProgress = useSharedValue(0);

  const startRestCountdown = useCallback(
    (durationMs: number, resetRingToFull: boolean) => {
      cancelAnimation(restProgress);
      if (durationMs <= 0) {
        restEndTimeRef.current = null;
        restProgress.value = 0;
        setRestSeconds(0);
        setRestTimeRemaining(0);
        setIsResting(false);
        return;
      }

      restEndTimeRef.current = Date.now() + durationMs;
      if (resetRingToFull || restProgress.value <= 0.01) {
        restProgress.value = 1;
      }
      // Animates linearly from current arc position to 0 over exact remaining ms
      restProgress.value = withTiming(0, {
        duration: durationMs,
        easing: Easing.linear,
      });

      const secs = Math.ceil(durationMs / 1000);
      setRestSeconds(secs);
      setRestTimeRemaining(secs);
      setIsResting(true);
    },
    [restProgress, setIsResting, setRestTimeRemaining],
  );

  const loadSetData = useCallback((setObj: ExerciseSet | undefined, activeUnit: WeightUnit) => {
    if (!setObj) {
      setWeightText('');
      setRepsText('');
      setRpeText('8');
      return;
    }

    if (activeUnit === 'BODYWEIGHT') {
      setWeightText('BW');
    } else if (setObj.weight !== null && setObj.weight !== undefined) {
      if (activeUnit === 'LBS') {
        setWeightText(String(Number((setObj.weight / LB_TO_KG).toFixed(1))));
      } else {
        setWeightText(String(setObj.weight));
      }
    } else {
      setWeightText('');
    }

    if (setObj.reps !== null && setObj.reps !== undefined) {
      setRepsText(String(setObj.reps));
    } else {
      setRepsText('');
    }

    if (setObj.rpe !== null && setObj.rpe !== undefined) {
      setRpeText(String(setObj.rpe));
    } else {
      setRpeText('8');
    }
  }, []);

  useEffect(() => {
    if (!isVisible || !exercise) {
      initializedExerciseRef.current = null;
      return;
    }

    if (initializedExerciseRef.current === exerciseIndex) {
      return;
    }
    initializedExerciseRef.current = exerciseIndex;

    const sets = exercise.sets || [];
    const firstIncompleteIdx = sets.findIndex((s) => !s.completed);

    if (sets.length > 0 && firstIncompleteIdx === -1) {
      setPhase('COMPLETED');
      setCurrentSetIndex(sets.length - 1);
      loadSetData(sets[sets.length - 1], unit);
    } else {
      const targetIdx = firstIncompleteIdx >= 0 ? firstIncompleteIdx : 0;
      setCurrentSetIndex(targetIdx);
      setPhase('READY');
      setTutSeconds(0);

      const targetSet = sets[targetIdx];
      if (targetSet && (targetSet.weight !== null || targetSet.reps !== null)) {
        loadSetData(targetSet, unit);
      } else if (targetIdx > 0 && sets[targetIdx - 1]) {
        loadSetData(sets[targetIdx - 1], unit);
      } else {
        setWeightText('');
        setRepsText('');
        setRpeText('8');
      }
    }
  }, [isVisible, exerciseIndex, exercise, loadSetData, unit]);

  // Initialize rest timer from store on modal open or active exercise change
  useEffect(() => {
    if (!isVisible) return;
    const storeState = useWorkoutStore.getState();
    if (storeState.isResting && storeState.restTimeRemaining > 0) {
      const remainingMs = storeState.restTimeRemaining * 1000;
      const baseTotalMs = Math.max(configuredRest * 1000, remainingMs, 1000);
      cancelAnimation(restProgress);
      restEndTimeRef.current = Date.now() + remainingMs;
      restProgress.value = Math.min(1, remainingMs / baseTotalMs);
      restProgress.value = withTiming(0, {
        duration: remainingMs,
        easing: Easing.linear,
      });
      setRestSeconds(storeState.restTimeRemaining);
    } else {
      startRestCountdown(0, true);
    }
  }, [isVisible, exerciseIndex, configuredRest, restProgress, startRestCountdown]);

  // Active set TUT stopwatch + smooth 60s sweep
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isVisible && phase === 'ACTIVE') {
      tutProgress.value = 0;
      tutProgress.value = withRepeat(
        withTiming(1, { duration: 60000, easing: Easing.linear }),
        -1,
        false,
      );
      interval = setInterval(() => {
        setTutSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      cancelAnimation(tutProgress);
      tutProgress.value = 0;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible, phase, tutProgress]);

  // Timestamp-locked rest countdown ticker
  const isRestTicking = isVisible && (phase === 'LOGGING' || phase === 'READY') && restSeconds > 0;
  useEffect(() => {
    if (!isRestTicking) return;

    const interval = setInterval(() => {
      const endTime = restEndTimeRef.current;
      if (!endTime) {
        setRestSeconds(0);
        return;
      }
      const remainingMs = endTime - Date.now();
      if (remainingMs <= 0) {
        restEndTimeRef.current = null;
        setRestSeconds(0);
      } else {
        setRestSeconds(Math.ceil(remainingMs / 1000));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRestTicking]);

  // Synchronize rest state to global store post-render
  useEffect(() => {
    if (!isVisible) return;
    setRestTimeRemaining(restSeconds);
    if (restSeconds <= 0) {
      setIsResting(false);
    }
  }, [isVisible, restSeconds, setRestTimeRemaining, setIsResting]);

  const handleStartSet = () => {
    startRestCountdown(0, true);
    setTutSeconds(0);
    setPhase('ACTIVE');
  };

  const handleFinishSet = () => {
    startRestCountdown(configuredRest * 1000, true);
    setPhase('LOGGING');
  };

  const handleSkipRest = () => {
    startRestCountdown(0, true);
  };

  const handleAdjustRest = (deltaSeconds: number) => {
    const currentRemainingMs =
      restEndTimeRef.current !== null
        ? Math.max(0, restEndTimeRef.current - Date.now())
        : restSeconds * 1000;

    const newRemainingMs = Math.max(0, currentRemainingMs + deltaSeconds * 1000);
    // Keep current arc progress and stretch/compress remaining duration smoothly
    startRestCountdown(newRemainingMs, currentRemainingMs <= 0);
  };

  const handleUnitChange = (newUnit: WeightUnit) => {
    if (newUnit === unit) return;

    if (newUnit === 'BODYWEIGHT') {
      setWeightText('BW');
      setUnit(newUnit);
      return;
    }

    if (unit === 'BODYWEIGHT') {
      const savedWeight = exercise?.sets[currentSetIndex]?.weight;
      if (savedWeight !== null && savedWeight !== undefined) {
        if (newUnit === 'LBS') {
          setWeightText(String(Number((savedWeight / LB_TO_KG).toFixed(1))));
        } else {
          setWeightText(String(savedWeight));
        }
      } else {
        setWeightText('');
      }
    } else {
      const val = parseFloat(weightText.replace(',', '.'));
      if (!isNaN(val)) {
        if (newUnit === 'LBS' && unit === 'KG') {
          setWeightText(String(Number((val / LB_TO_KG).toFixed(1))));
        } else if (newUnit === 'KG' && unit === 'LBS') {
          setWeightText(String(Number((val * LB_TO_KG).toFixed(1))));
        }
      }
    }

    setUnit(newUnit);
  };

  const handleAdjustWeight = (delta: number) => {
    if (unit === 'BODYWEIGHT') return;
    const current = parseFloat(weightText.replace(',', '.')) || 0;
    const next = Math.max(0, Number((current + delta).toFixed(1)));
    setWeightText(String(next));
  };

  const handleAdjustReps = (delta: number) => {
    const current = parseInt(repsText, 10) || 0;
    const next = Math.max(0, current + delta);
    setRepsText(String(next));
  };

  const handleAdjustRpe = (delta: number) => {
    const current = parseFloat(rpeText.replace(',', '.')) || 8;
    const next = Math.min(10, Math.max(1, Number((current + delta).toFixed(1))));
    setRpeText(String(next));
  };

  const handleSaveSet = () => {
    if (!exercise) return;

    let finalWeight: number | null = null;
    if (unit === 'BODYWEIGHT') {
      finalWeight = null;
    } else {
      const sanitized = weightText.replace(',', '.').trim();
      if (sanitized) {
        const parsed = parseFloat(sanitized);
        if (!isNaN(parsed)) {
          finalWeight = unit === 'LBS' ? Number((parsed * LB_TO_KG).toFixed(2)) : parsed;
        }
      }
    }

    const sanitizedReps = repsText.trim();
    const finalReps = sanitizedReps ? parseInt(sanitizedReps, 10) : null;

    const sanitizedRpe = rpeText.replace(',', '.').trim();
    const parsedRpe = parseFloat(sanitizedRpe);
    const finalRpe = !isNaN(parsedRpe) ? parsedRpe : 8;

    updateSet(exerciseIndex, currentSetIndex, {
      weight: finalWeight,
      reps: isNaN(finalReps as number) ? null : finalReps,
      rpe: finalRpe,
      completed: true,
    });

    if (currentSetIndex < exercise.sets.length - 1) {
      const nextIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextIdx);
      const nextSet = exercise.sets[nextIdx];
      if (nextSet && (nextSet.weight !== null || nextSet.reps !== null)) {
        loadSetData(nextSet, unit);
      }
      setPhase('READY');
    } else {
      setPhase('COMPLETED');
    }
  };

  const handleSelectSet = (idx: number) => {
    if (!exercise || idx === currentSetIndex) return;
    setCurrentSetIndex(idx);
    const targetSet = exercise.sets[idx];
    if (targetSet) {
      loadSetData(targetSet, unit);
      if (targetSet.completed) {
        setPhase('LOGGING');
      } else {
        setPhase('READY');
      }
    }
  };

  const handleAddAnotherSet = () => {
    if (!exercise) return;
    addSetToExercise(exerciseIndex);
    const newIdx = exercise.sets.length;
    setCurrentSetIndex(newIdx);
    setWeightText(weightText || '');
    setRepsText(repsText || '');
    setRpeText(rpeText || '8');
    setPhase('READY');
  };

  const handleNextExercise = () => {
    if (onSelectNextExercise) {
      onSelectNextExercise();
      setPhase('READY');
      setTutSeconds(0);
    }
  };

  if (!exercise) return null;

  const prevSet = currentSetIndex > 0 ? exercise.sets[currentSetIndex - 1] : undefined;
  const isLastExercise = exerciseIndex >= totalExercises - 1;

  const restDiameter = tutDiameter * 0.9;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ backgroundColor: colors.brand.background }}
        className="flex-1"
        edges={['top', 'bottom']}
      >
        <View
          style={{
            borderBottomColor: colors.brand.surfaceBorder,
            backgroundColor: colors.brand.surface,
          }}
          className="px-5 py-4 border-b flex-row items-center justify-between"
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={{
              backgroundColor: colors.brand.surfaceAlt,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="w-10 h-10 rounded-full items-center justify-center border"
          >
            <Ionicons name="close" size={24} color={colors.content.primary} />
          </TouchableOpacity>
          <View className="items-center">
            <AppText
              weight="bold"
              style={{ color: colors.content.secondary }}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              {t('activeExercise.exerciseOf', {
                current: exerciseIndex + 1,
                total: totalExercises,
              })}
            </AppText>
            <AppText
              weight="bold"
              style={{ color: colors.brand.primary }}
              className="text-lg font-bold"
              numberOfLines={1}
            >
              {exercise.name}
            </AppText>
          </View>
          {restSeconds > 0 ? (
            <View
              style={{
                backgroundColor: colors.status.info + '20',
                borderColor: colors.status.info + '30',
              }}
              className="flex-row items-center px-3 py-1.5 rounded-full border"
            >
              <Ionicons name="timer-outline" size={14} color={colors.status.infoLight} />
              <AppText
                weight="bold"
                style={{ color: colors.status.infoLight }}
                className="text-sm font-bold ml-1 font-mono"
              >
                {formatStopwatch(restSeconds)}
              </AppText>
            </View>
          ) : (
            <View className="w-10" />
          )}
        </View>

        <View
          style={{
            borderBottomColor: colors.brand.surfaceBorder + '60',
            backgroundColor: colors.brand.surface + '80',
          }}
          className="px-5 py-3 border-b"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {exercise.sets.map((s, idx) => {
              const isCurrent = idx === currentSetIndex;
              const isCompleted = s.completed;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSelectSet(idx)}
                  style={{
                    backgroundColor: isCurrent
                      ? colors.brand.primary
                      : isCompleted
                        ? colors.status.info + '20'
                        : colors.brand.surfaceAlt,
                    borderColor: isCurrent
                      ? colors.brand.primary
                      : isCompleted
                        ? colors.status.info + '40'
                        : colors.brand.surfaceBorder,
                  }}
                  className="flex-row items-center py-2 px-4 rounded-full mr-2 border"
                >
                  {isCompleted && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={isCurrent ? colors.brand.background : colors.status.infoLight}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <AppText
                    weight="bold"
                    style={{
                      color: isCurrent
                        ? colors.brand.background
                        : isCompleted
                          ? colors.status.infoLight
                          : colors.content.secondary,
                    }}
                    className="text-sm font-bold"
                  >
                    {t('activeExercise.setNumber', { number: s.setNumber })}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* ════ PHASE A: READY ════ */}
            {phase === 'READY' && (
              <View className="flex-1 items-center justify-between py-4">
                <View className="items-center w-full">
                  <View
                    style={{
                      backgroundColor: colors.brand.surfaceAlt + '80',
                      borderColor: colors.brand.surfaceBorder,
                    }}
                    className="border px-5 py-2 rounded-full mb-3"
                  >
                    <AppText
                      weight="bold"
                      style={{ color: colors.content.secondary }}
                      className="text-sm font-bold uppercase tracking-wider"
                    >
                      {t('activeExercise.setOf', {
                        current: currentSetIndex + 1,
                        total: exercise.sets.length,
                      })}
                    </AppText>
                  </View>
                  <AppText
                    weight="bold"
                    style={{ color: colors.brand.primary }}
                    className="text-4xl font-extrabold text-center px-2"
                  >
                    {exercise.name}
                  </AppText>

                  {restSeconds > 0 && (
                    <View
                      style={{
                        backgroundColor: colors.status.info + '15',
                        borderColor: colors.status.info + '30',
                      }}
                      className="w-full border rounded-2xl p-4 mt-5 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="timer-outline"
                          size={24}
                          color={colors.status.infoLight}
                        />
                        <View className="ml-3">
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-sm font-bold"
                          >
                            {t('activeExercise.restingInProgress')}
                          </AppText>
                          <AppText
                            weight="bold"
                            style={{ color: colors.status.infoLight }}
                            className="text-base font-extrabold font-mono"
                          >
                            {t('activeExercise.remaining', {
                              time: formatStopwatch(restSeconds),
                            })}
                          </AppText>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={handleSkipRest}
                        style={{
                          backgroundColor: colors.brand.surface,
                          borderColor: colors.brand.surfaceBorder,
                        }}
                        className="px-4 py-2 rounded-lg border"
                      >
                        <AppText
                          weight="semibold"
                          style={{ color: colors.content.primary }}
                          className="text-sm font-semibold"
                        >
                          {t('activeExercise.skip')}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {prevSet && (
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="w-full rounded-2xl p-5 mt-4 border flex-row items-center justify-between"
                    >
                      <View>
                        <AppText
                          weight="bold"
                          style={{ color: colors.content.secondary }}
                          className="text-xs font-bold uppercase tracking-wider"
                        >
                          {t('activeExercise.lastSet', { number: prevSet.setNumber })}
                        </AppText>
                        <AppText
                          weight="bold"
                          style={{ color: colors.brand.primary }}
                          className="text-lg font-bold mt-1"
                        >
                          {prevSet.weight !== null ? `${prevSet.weight} kg` : 'Bodyweight'} ×{' '}
                          {prevSet.reps ?? 0} reps (RPE {prevSet.rpe ?? 8})
                        </AppText>
                      </View>
                      <Ionicons
                        name="checkmark-done"
                        size={28}
                        color={colors.status.infoLight}
                      />
                    </View>
                  )}
                </View>

                <View className="items-center my-8">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleStartSet}
                    style={{
                      backgroundColor: colors.brand.primary,
                      borderColor: colors.brand.surfaceAlt,
                    }}
                    className="w-56 h-56 rounded-full items-center justify-center shadow-2xl border-4"
                  >
                    <Ionicons
                      name="play"
                      size={60}
                      color={colors.brand.background}
                      style={{ marginLeft: 6 }}
                    />
                    <AppText
                      weight="bold"
                      style={{ color: colors.brand.background }}
                      className="text-2xl font-black mt-2"
                    >
                      {t('activeExercise.startSet')}
                    </AppText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleSelectSet(currentSetIndex)}
                  className="py-2"
                >
                </TouchableOpacity>
              </View>
            )}

            {/* ════ PHASE B: ACTIVE ════ */}
            {phase === 'ACTIVE' && (
              <View className="flex-1 items-center justify-between py-4">
                <View className="items-center">
                  <View
                    style={{
                      backgroundColor: colors.status.info + '15',
                      borderColor: colors.status.info + '30',
                    }}
                    className="border px-5 py-2 rounded-full mb-3"
                  >
                    <AppText
                      weight="bold"
                      style={{ color: colors.status.infoLight }}
                      className="text-sm font-bold uppercase tracking-wider"
                    >
                      {t('activeExercise.recordingSet', { current: currentSetIndex + 1 })}
                    </AppText>
                  </View>
                  <AppText
                    weight="bold"
                    style={{ color: colors.brand.primary }}
                    className="text-3xl font-bold text-center"
                  >
                    {exercise.name}
                  </AppText>
                </View>

                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginVertical: tutDiameter * 0.08,
                  }}
                >
                  <View
                    style={{
                      width: tutDiameter,
                      height: tutDiameter,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ position: 'absolute', top: 0, left: 0 }}>
                      <SmoothProgressRing
                        diameter={tutDiameter}
                        strokeWidth={tutStrokeWidth}
                        progress={tutProgress}
                        activeColor={colors.brand.surfaceBorder}
                        trackColor={colors.brand.surfaceBorder}
                      />
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <AppText
                        weight="bold"
                        style={{
                          fontSize: tutFontSize,
                          fontWeight: '900',
                          color: colors.brand.primary,
                          fontVariant: ['tabular-nums'],
                          includeFontPadding: false,
                        }}
                      >
                        {formatStopwatch(tutSeconds)}
                      </AppText>
                      <AppText
                        weight="bold"
                        style={{
                          fontSize: tutDiameter * 0.037,
                          fontWeight: 'bold',
                          color: colors.content.secondary,
                          letterSpacing: 2,
                          marginTop: tutDiameter * 0.025,
                        }}
                      >
                        {t('activeExercise.timeUnderTension')}
                      </AppText>
                    </View>
                  </View>
                </View>

                <View className="w-full">
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleFinishSet}
                    style={{ backgroundColor: colors.status.info }}
                    className="w-full py-5 rounded-2xl flex-row items-center justify-center shadow-xl"
                  >
                    <Ionicons name="checkmark-done" size={28} color={colors.brand.primary} />
                    <AppText
                      weight="bold"
                      style={{ color: colors.brand.primary }}
                      className="text-xl font-bold ml-2"
                    >
                      {t('activeExercise.finishSet')}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ════ PHASE C: LOGGING ════ */}
            {phase === 'LOGGING' && (
              <View className="flex-1 justify-between py-2">
                <View>
                  {/* Rest Countdown */}
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginVertical: restDiameter * 0.06,
                    }}
                  >
                    <View
                      style={{
                        width: restDiameter,
                        height: restDiameter,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View style={{ position: 'absolute', top: 0, left: 0 }}>
                        <SmoothProgressRing
                          diameter={restDiameter}
                          strokeWidth={tutStrokeWidth}
                          progress={restProgress}
                          activeColor={colors.status.info}
                          trackColor={colors.brand.surfaceBorder}
                        />
                      </View>
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <AppText
                          weight="bold"
                          style={{
                            fontSize: tutFontSize,
                            fontWeight: '900',
                            color: colors.brand.primary,
                            fontVariant: ['tabular-nums'],
                            includeFontPadding: false,
                          }}
                        >
                          {formatStopwatch(restSeconds)}
                        </AppText>
                        <AppText
                          weight="bold"
                          style={{
                            fontSize: restDiameter * 0.04,
                            fontWeight: 'bold',
                            color: colors.content.secondary,
                            letterSpacing: 2,
                            marginTop: restDiameter * 0.025,
                          }}
                        >
                          {t('activeExercise.resting')}
                        </AppText>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-3 mt-6">
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleAdjustRest(-15)}
                        style={{
                          backgroundColor: colors.brand.surfaceAlt,
                          borderColor: colors.brand.surfaceBorder,
                        }}
                        className="px-5 py-3 rounded-xl border"
                      >
                        <AppText
                          weight="semibold"
                          style={{ color: colors.brand.primary }}
                          className="text-sm font-semibold"
                        >
                          -15s
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSkipRest}
                        style={{
                          backgroundColor: colors.status.info + '20',
                          borderColor: colors.status.info + '40',
                        }}
                        className="px-6 py-3 rounded-xl border"
                      >
                        <AppText
                          weight="bold"
                          style={{ color: colors.status.infoLight }}
                          className="text-sm font-bold"
                        >
                          {t('activeExercise.skipRest')}
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleAdjustRest(30)}
                        style={{
                          backgroundColor: colors.brand.surfaceAlt,
                          borderColor: colors.brand.surfaceBorder,
                        }}
                        className="px-5 py-3 rounded-xl border"
                      >
                        <AppText
                          weight="semibold"
                          style={{ color: colors.brand.primary }}
                          className="text-sm font-semibold"
                        >
                          +30s
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: colors.brand.surface,
                      borderColor: colors.brand.surfaceBorder,
                    }}
                    className="flex-row items-center p-1.5 rounded-xl mb-4 border"
                  >
                    {(['KG', 'LBS', 'BODYWEIGHT'] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        activeOpacity={0.8}
                        onPress={() => handleUnitChange(opt)}
                        style={{
                          backgroundColor: unit === opt ? colors.brand.primary : 'transparent',
                        }}
                        className="flex-1 py-3 rounded-lg items-center justify-center"
                      >
                        <AppText
                          weight="bold"
                          style={{
                            color:
                              unit === opt
                                ? colors.brand.background
                                : colors.content.secondary,
                          }}
                          className="text-sm font-bold"
                        >
                          {opt === 'BODYWEIGHT' ? t('activeExercise.bodyweight') : opt}
                        </AppText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Weight, Reps, RPE */}
                  <View className="flex-row gap-3 mb-6">
                    {/* Weight Box */}
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="flex-1 p-4 rounded-2xl border"
                    >
                      <AppText
                        weight="bold"
                        style={{ color: colors.content.secondary }}
                        className="text-[10px] font-bold uppercase tracking-wider mb-2 text-center"
                      >
                        {t('activeExercise.weight')}
                      </AppText>
                      {unit === 'BODYWEIGHT' ? (
                        <View
                          style={{
                            backgroundColor: colors.brand.surfaceAlt,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="h-12 rounded-xl items-center justify-center border"
                        >
                          <AppText
                            weight="bold"
                            style={{ color: colors.content.secondary }}
                            className="font-bold text-sm"
                          >
                            BW
                          </AppText>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-between">
                          <TouchableOpacity
                            onPress={() => handleAdjustWeight(unit === 'LBS' ? -5 : -2.5)}
                            style={{
                              backgroundColor: colors.brand.surfaceAlt,
                              borderColor: colors.brand.surfaceBorder,
                            }}
                            className="w-9 h-9 rounded-xl items-center justify-center border"
                          >
                            <AppText
                              weight="bold"
                              style={{ color: colors.brand.primary }}
                              className="text-lg font-bold"
                            >
                              -
                            </AppText>
                          </TouchableOpacity>
                          <TextInput
                            value={weightText}
                            onChangeText={setWeightText}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            placeholderTextColor={colors.content.muted}
                            style={{ color: colors.brand.primary }}
                            className="flex-1 text-center text-xl font-extrabold mx-1"
                          />
                          <TouchableOpacity
                            onPress={() => handleAdjustWeight(unit === 'LBS' ? 5 : 2.5)}
                            style={{
                              backgroundColor: colors.brand.surfaceAlt,
                              borderColor: colors.brand.surfaceBorder,
                            }}
                            className="w-9 h-9 rounded-xl items-center justify-center border"
                          >
                            <AppText
                              weight="bold"
                              style={{ color: colors.brand.primary }}
                              className="text-lg font-bold"
                            >
                              +
                            </AppText>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Reps Box */}
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="flex-1 p-4 rounded-2xl border"
                    >
                      <AppText
                        weight="bold"
                        style={{ color: colors.content.secondary }}
                        className="text-[10px] font-bold uppercase tracking-wider mb-2 text-center"
                      >
                        {t('activeExercise.reps')}
                      </AppText>
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                          onPress={() => handleAdjustReps(-1)}
                          style={{
                            backgroundColor: colors.brand.surfaceAlt,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="w-9 h-9 rounded-xl items-center justify-center border"
                        >
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-lg font-bold"
                          >
                            -
                          </AppText>
                        </TouchableOpacity>
                        <TextInput
                          value={repsText}
                          onChangeText={setRepsText}
                          keyboardType="number-pad"
                          placeholder="0"
                          placeholderTextColor={colors.content.muted}
                          style={{ color: colors.brand.primary }}
                          className="flex-1 text-center text-xl font-extrabold mx-1"
                        />
                        <TouchableOpacity
                          onPress={() => handleAdjustReps(1)}
                          style={{
                            backgroundColor: colors.brand.surfaceAlt,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="w-9 h-9 rounded-xl items-center justify-center border"
                        >
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-lg font-bold"
                          >
                            +
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* RPE Box */}
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="flex-1 p-4 rounded-2xl border"
                    >
                      <AppText
                        weight="bold"
                        style={{ color: colors.content.secondary }}
                        className="text-[10px] font-bold uppercase tracking-wider mb-2 text-center"
                      >
                        {t('activeExercise.rpe')}
                      </AppText>
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                          onPress={() => handleAdjustRpe(-0.5)}
                          style={{
                            backgroundColor: colors.brand.surfaceAlt,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="w-9 h-9 rounded-xl items-center justify-center border"
                        >
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-lg font-bold"
                          >
                            -
                          </AppText>
                        </TouchableOpacity>
                        <TextInput
                          value={rpeText}
                          onChangeText={setRpeText}
                          keyboardType="decimal-pad"
                          placeholder="8"
                          placeholderTextColor={colors.content.muted}
                          style={{ color: colors.brand.primary }}
                          className="flex-1 text-center text-xl font-extrabold mx-1"
                        />
                        <TouchableOpacity
                          onPress={() => handleAdjustRpe(0.5)}
                          style={{
                            backgroundColor: colors.brand.surfaceAlt,
                            borderColor: colors.brand.surfaceBorder,
                          }}
                          className="w-9 h-9 rounded-xl items-center justify-center border"
                        >
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-lg font-bold"
                          >
                            +
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSaveSet}
                  style={{ backgroundColor: colors.brand.primary }}
                  className="w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
                >
                  <Ionicons name="checkmark" size={24} color={colors.brand.background} />
                  <AppText
                    weight="bold"
                    style={{ color: colors.brand.background }}
                    className="text-lg font-bold ml-2"
                  >
                    {t('activeExercise.saveSet')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* ════ PHASE D: COMPLETED ════ */}
            {phase === 'COMPLETED' && (
              <View className="flex-1 justify-between py-2">
                <View>
                  <View className="items-center my-6">
                    <View
                      style={{
                        backgroundColor: colors.status.info + '20',
                        borderColor: colors.status.info + '40',
                      }}
                      className="w-24 h-24 rounded-full items-center justify-center border-2 mb-4"
                    >
                      <Ionicons
                        name="trophy-outline"
                        size={48}
                        color={colors.status.infoLight}
                      />
                    </View>
                    <AppText
                      weight="bold"
                      style={{ color: colors.brand.primary }}
                      className="text-3xl font-black text-center"
                    >
                      {t('activeExercise.completedTitle')}
                    </AppText>
                    <AppText
                      style={{ color: colors.content.secondary }}
                      className="text-sm text-center mt-2"
                    >
                      {t('activeExercise.completedSubtitle', {
                        total: exercise.sets.length,
                      })}
                    </AppText>
                  </View>

                  <View
                    style={{
                      backgroundColor: colors.brand.surface,
                      borderColor: colors.brand.surfaceBorder,
                    }}
                    className="w-full rounded-2xl p-5 mb-4 border"
                  >
                    <AppText
                      weight="bold"
                      style={{ color: colors.content.secondary }}
                      className="text-xs font-bold uppercase tracking-wider mb-3"
                    >
                      {t('activeExercise.summarySets')}
                    </AppText>
                    {exercise.sets.map((s, idx) => (
                      <View
                        key={idx}
                        style={{ borderBottomColor: colors.brand.surfaceBorder + '40' }}
                        className="flex-row items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <View className="flex-row items-center">
                          <View
                            style={{ backgroundColor: colors.status.info + '20' }}
                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                          >
                            <AppText
                              weight="bold"
                              style={{ color: colors.status.infoLight }}
                              className="text-sm font-bold"
                            >
                              {s.setNumber}
                            </AppText>
                          </View>
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-base font-semibold"
                          >
                            {t('activeExercise.setNumber', { number: s.setNumber })}
                          </AppText>
                        </View>
                        <AppText
                          style={{ color: colors.content.secondary }}
                          className="text-sm font-semibold"
                        >
                          {s.weight !== null && s.weight !== undefined && s.weight > 0
                            ? `${s.weight} kg`
                            : 'BW'}{' '}
                          × {s.reps ?? 0} reps (RPE {s.rpe ?? 8})
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="w-full gap-4 mt-5">
                  {!isLastExercise && nextExerciseName ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleNextExercise}
                      style={{ backgroundColor: colors.brand.primary }}
                      className="w-full py-5 rounded-2xl flex-row items-center justify-center shadow-lg"
                    >
                      <AppText
                        weight="bold"
                        style={{ color: colors.brand.background }}
                        className="text-lg font-bold mr-2"
                      >
                        {t('activeExercise.nextExercise', { name: nextExerciseName })}
                      </AppText>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={colors.brand.background}
                      />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onClose}
                    style={{
                      backgroundColor:
                        !isLastExercise && nextExerciseName
                          ? colors.brand.surface
                          : colors.brand.primary,
                      borderColor: colors.brand.surfaceBorder,
                    }}
                    className={`w-full py-5 rounded-2xl flex-row items-center justify-center ${!isLastExercise && nextExerciseName ? 'border' : 'shadow-lg'
                      }`}
                  >
                    <AppText
                      weight="bold"
                      style={{
                        color:
                          !isLastExercise && nextExerciseName
                            ? colors.brand.primary
                            : colors.brand.background,
                      }}
                      className="text-lg font-bold"
                    >
                      {t('activeExercise.backToOverview')}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleAddAnotherSet}
                    className="w-full py-3 items-center justify-center"
                  >
                    <AppText
                      weight="bold"
                      style={{ color: colors.status.infoLight }}
                      className="text-sm font-bold uppercase tracking-wider"
                    >
                      {t('activeExercise.addAnotherSet')}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}