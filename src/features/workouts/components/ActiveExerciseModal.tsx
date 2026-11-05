import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Colors } from '@/theme/colors';
import type { ExerciseSet } from '@/types/session';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const addSetToExercise = useWorkoutStore((s) => s.addSetToExercise);
  const setIsResting = useWorkoutStore((s) => s.setIsResting);
  const setRestTimeRemaining = useWorkoutStore((s) => s.setRestTimeRemaining);
  const { width, height } = useWindowDimensions();

  const tutDiameter = Math.min(width * 0.78, height * 0.38, 320);
  const tutRadius = tutDiameter / 2;
  const tutFontSize = tutDiameter * 0.18;
  const tutStrokeWidth = Math.max(8, tutDiameter * 0.043);

  const exercise = activeSession?.exercises[exerciseIndex];

  const [phase, setPhase] = useState<ModalPhase>('READY');
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [unit, setUnit] = useState<WeightUnit>('KG');
  const [tutSeconds, setTutSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [totalRestDuration, setTotalRestDuration] = useState(60);

  const [weightText, setWeightText] = useState('');
  const [repsText, setRepsText] = useState('');
  const [rpeText, setRpeText] = useState('8'); // RPE por defecto por si lo dejan vacío

  const initializedExerciseRef = useRef<number | null>(null);

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

    if (initializedExerciseRef.current === exerciseIndex) return;
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
  }, [isVisible, exerciseIndex]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isVisible && phase === 'ACTIVE') {
      interval = setInterval(() => setTutSeconds((prev) => prev + 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isVisible, phase]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isVisible && (phase === 'LOGGING' || phase === 'READY') && restSeconds > 0) {
      interval = setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            setRestTimeRemaining(0);
            return 0;
          }
          const next = prev - 1;
          setRestTimeRemaining(next);
          return next;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isVisible, phase, restSeconds, setIsResting, setRestTimeRemaining]);

  const handleStartSet = () => {
    setRestSeconds(0);
    setIsResting(false);
    setRestTimeRemaining(0);
    setTutSeconds(0);
    setPhase('ACTIVE');
  };

  const handleFinishSet = () => {
    setTotalRestDuration(60);
    setRestSeconds(60);
    setIsResting(true);
    setRestTimeRemaining(60);
    setPhase('LOGGING');
  };

  const handleSkipRest = () => {
    setRestSeconds(0);
    setIsResting(false);
    setRestTimeRemaining(0);
  };

  const handleAdjustRest = (delta: number) => {
    setRestSeconds((prev) => {
      const updated = Math.max(0, prev + delta);
      setRestTimeRemaining(updated);
      if (updated > totalRestDuration) setTotalRestDuration(updated);
      return updated;
    });
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

    let finalWeight: number = 0;
    if (unit !== 'BODYWEIGHT') {
      const sanitized = weightText.replace(',', '.').trim();
      const parsed = parseFloat(sanitized);
      if (!isNaN(parsed)) {
        finalWeight = unit === 'LBS' ? Number((parsed * LB_TO_KG).toFixed(2)) : parsed;
      }
    }

    const finalReps = parseInt(repsText.trim(), 10) || 0;
    const finalRpe = parseFloat(rpeText.replace(',', '.').trim()) || 8; // Obligatorio para Spring Boot

    updateSet(exerciseIndex, currentSetIndex, {
      weight: finalWeight,
      reps: finalReps,
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

  const currentSet = exercise.sets[currentSetIndex];
  const prevSet = currentSetIndex > 0 ? exercise.sets[currentSetIndex - 1] : undefined;
  const isLastExercise = exerciseIndex >= totalExercises - 1;

  const restDiameter = tutDiameter * 0.9;
  const restRadius = tutRadius * 0.9;

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-brand-background" edges={['top', 'bottom']}>

        <View className="px-5 py-4 border-b border-brand-surfaceBorder flex-row items-center justify-between">
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} className="w-10 h-10 rounded-full bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
            <Ionicons name="close" size={24} color={Colors.content.primary} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-content-secondary text-[11px] font-bold uppercase tracking-wider">
              Exercise {exerciseIndex + 1} of {totalExercises}
            </Text>
            <Text className="text-brand-primary text-lg font-bold" numberOfLines={1}>{exercise.name}</Text>
          </View>
          {restSeconds > 0 ? (
            <View className="flex-row items-center bg-status-info/20 px-3 py-1.5 rounded-full border border-status-info/30">
              <Ionicons name="timer-outline" size={14} color={Colors.status.infoLight} />
              <Text className="text-status-infoLight text-sm font-bold ml-1 font-mono">
                {formatStopwatch(restSeconds)}
              </Text>
            </View>
          ) : (
            <View className="w-10" />
          )}
        </View>

        <View className="px-5 py-3 border-b border-brand-surfaceBorder/60 bg-brand-surface/40">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {exercise.sets.map((s, idx) => {
              const isCurrent = idx === currentSetIndex;
              const isCompleted = s.completed;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSelectSet(idx)}
                  className={`flex-row items-center py-2 px-4 rounded-full mr-2 border ${isCurrent ? 'bg-brand-primary border-brand-primary' : isCompleted ? 'bg-status-info/20 border-status-info/40' : 'bg-brand-surfaceAlt border-brand-surfaceBorder'}`}
                >
                  {isCompleted && <Ionicons name="checkmark-circle" size={16} color={isCurrent ? Colors.brand.background : Colors.status.infoLight} style={{ marginRight: 4 }} />}
                  <Text className={`text-sm font-bold ${isCurrent ? 'text-brand-background' : isCompleted ? 'text-status-infoLight' : 'text-content-secondary'}`}>
                    Set {s.setNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 16 }} keyboardShouldPersistTaps="handled">

            {/* ════ PHASE A: READY ════ */}
            {phase === 'READY' && (
              <View className="flex-1 items-center justify-between py-4">
                <View className="items-center w-full">
                  <View className="bg-brand-surfaceAlt/80 border border-brand-surfaceBorder px-5 py-2 rounded-full mb-3">
                    <Text className="text-content-secondary text-sm font-bold uppercase tracking-wider">
                      Set {currentSetIndex + 1} of {exercise.sets.length}
                    </Text>
                  </View>
                  <Text className="text-brand-primary text-4xl font-extrabold text-center px-2">{exercise.name}</Text>

                  {restSeconds > 0 && (
                    <View className="w-full bg-status-info/10 border border-status-info/30 rounded-2xl p-4 mt-5 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="timer-outline" size={24} color={Colors.status.infoLight} />
                        <View className="ml-3">
                          <Text className="text-brand-primary text-sm font-bold">Resting in progress</Text>
                          <Text className="text-status-infoLight text-base font-extrabold font-mono">
                            {formatStopwatch(restSeconds)} remaining
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={handleSkipRest} className="bg-brand-surface px-4 py-2 rounded-lg border border-brand-surfaceBorder">
                        <Text className="text-content-primary text-sm font-semibold">Skip</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {prevSet && (
                    <View className="w-full bg-brand-surface rounded-2xl p-5 mt-4 border border-brand-surfaceBorder flex-row items-center justify-between">
                      <View>
                        <Text className="text-content-secondary text-xs font-bold uppercase tracking-wider">Last Set (#{prevSet.setNumber})</Text>
                        <Text className="text-brand-primary text-lg font-bold mt-1">
                          {prevSet.weight !== null ? `${prevSet.weight} kg` : 'Bodyweight'} × {prevSet.reps ?? 0} reps (RPE {prevSet.rpe ?? 8})
                        </Text>
                      </View>
                      <Ionicons name="checkmark-done" size={28} color={Colors.status.infoLight} />
                    </View>
                  )}
                </View>

                <View className="items-center my-8">
                  <TouchableOpacity activeOpacity={0.85} onPress={handleStartSet} className="w-56 h-56 rounded-full bg-brand-primary items-center justify-center shadow-2xl border-4 border-brand-surfaceAlt">
                    <Ionicons name="play" size={60} color={Colors.brand.background} style={{ marginLeft: 6 }} />
                    <Text className="text-brand-background text-2xl font-black mt-2">Start Set</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => handleSelectSet(currentSetIndex)} className="py-2">
                  <Text className="text-content-muted text-sm underline">Want to manually log without stopwatch?</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ════ PHASE B: ACTIVE ════ */}
            {phase === 'ACTIVE' && (
              <View className="flex-1 items-center justify-between py-4">
                <View className="items-center">
                  <View className="bg-status-info/10 border border-status-info/30 px-5 py-2 rounded-full mb-3">
                    <Text className="text-status-infoLight text-sm font-bold uppercase tracking-wider">
                      Recording Set {currentSetIndex + 1}
                    </Text>
                  </View>
                  <Text className="text-brand-primary text-3xl font-bold text-center">{exercise.name}</Text>
                </View>

                <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: tutDiameter * 0.08 }}>
                  <View style={{ width: tutDiameter, height: tutDiameter, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ position: 'absolute', top: 0, left: 0 }}>
                      <CircularProgressBase
                        value={tutSeconds % 60}
                        maxValue={60}
                        radius={tutRadius}
                        duration={1000}
                        activeStrokeColor={Colors.status.info}
                        inActiveStrokeColor={Colors.brand.surfaceBorder}
                        activeStrokeWidth={tutStrokeWidth}
                        inActiveStrokeWidth={tutStrokeWidth}
                      />
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: tutFontSize, fontWeight: '900', color: Colors.brand.primary, fontVariant: ['tabular-nums'], includeFontPadding: false }}>
                        {formatStopwatch(tutSeconds)}
                      </Text>
                      <Text style={{ fontSize: tutDiameter * 0.037, fontWeight: 'bold', color: Colors.content?.secondary ?? '#999', letterSpacing: 2, marginTop: tutDiameter * 0.025 }}>
                        TIME UNDER TENSION
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="w-full">
                  <TouchableOpacity activeOpacity={0.85} onPress={handleFinishSet} className="w-full bg-status-info py-5 rounded-2xl flex-row items-center justify-center shadow-xl">
                    <Ionicons name="checkmark-done" size={28} color={Colors.brand.primary} />
                    <Text className="text-brand-primary text-xl font-bold ml-2">Finish Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ════ PHASE C: LOGGING (Incluye Peso, Reps y RPE obligatorio) ════ */}
            {phase === 'LOGGING' && (
              <View className="flex-1 justify-between py-2">
                <View>
                  {/* Cronómetro de Descanso */}
                  <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: restDiameter * 0.06 }}>
                    <View style={{ width: restDiameter, height: restDiameter, alignItems: 'center', justifyContent: 'center' }}>

                      <View style={{ position: 'absolute', top: 0, left: 0 }}>
                        <CircularProgressBase
                          value={restSeconds}
                          maxValue={totalRestDuration || 60}
                          radius={restRadius}
                          duration={1000}
                          activeStrokeColor={Colors.status.info}
                          inActiveStrokeColor={Colors.brand.surfaceBorder}
                          activeStrokeWidth={tutStrokeWidth}
                          inActiveStrokeWidth={tutStrokeWidth}
                        />
                      </View>

                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: tutFontSize, fontWeight: '900', color: Colors.brand.primary, fontVariant: ['tabular-nums'], includeFontPadding: false }}>
                          {formatStopwatch(restSeconds)}
                        </Text>
                        <Text style={{ fontSize: restDiameter * 0.04, fontWeight: 'bold', color: Colors.content.secondary, letterSpacing: 2, marginTop: restDiameter * 0.025 }}>
                          RESTING
                        </Text>
                      </View>

                    </View>

                    <View className="flex-row items-center gap-3 mt-6">
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleAdjustRest(-15)} className="bg-brand-surfaceAlt px-5 py-3 rounded-xl border border-brand-surfaceBorder">
                        <Text className="text-brand-primary text-sm font-semibold">-15s</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.8} onPress={handleSkipRest} className="bg-status-info/20 px-6 py-3 rounded-xl border border-status-info/40">
                        <Text className="text-status-infoLight text-sm font-bold">Skip Rest</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={0.7} onPress={() => handleAdjustRest(30)} className="bg-brand-surfaceAlt px-5 py-3 rounded-xl border border-brand-surfaceBorder">
                        <Text className="text-brand-primary text-sm font-semibold">+30s</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="flex-row items-center bg-brand-surface p-1.5 rounded-xl mb-4 border border-brand-surfaceBorder">
                    {(['KG', 'LBS', 'BODYWEIGHT'] as const).map((opt) => (
                      <TouchableOpacity key={opt} activeOpacity={0.8} onPress={() => handleUnitChange(opt)} className={`flex-1 py-3 rounded-lg items-center justify-center ${unit === opt ? 'bg-brand-primary' : 'bg-transparent'}`}>
                        <Text className={`text-sm font-bold ${unit === opt ? 'text-brand-background' : 'text-content-secondary'}`}>
                          {opt === 'BODYWEIGHT' ? 'Bodyweight' : opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Fila de Inputs: Peso, Reps y RPE */}
                  <View className="flex-row gap-3 mb-6">
                    {/* Weight Box */}
                    <View className="flex-1 bg-brand-surface p-4 rounded-2xl border border-brand-surfaceBorder">
                      <Text className="text-content-secondary text-[10px] font-bold uppercase tracking-wider mb-2 text-center">Weight</Text>
                      {unit === 'BODYWEIGHT' ? (
                        <View className="h-12 bg-brand-surfaceAlt rounded-xl items-center justify-center border border-brand-surfaceBorder">
                          <Text className="text-content-secondary font-bold text-sm">BW</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-between">
                          <TouchableOpacity onPress={() => handleAdjustWeight(unit === 'LBS' ? -5 : -2.5)} className="w-9 h-9 rounded-xl bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                            <Text className="text-brand-primary text-lg font-bold">-</Text>
                          </TouchableOpacity>
                          <TextInput value={weightText} onChangeText={setWeightText} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.content.muted} className="flex-1 text-center text-brand-primary text-xl font-extrabold mx-1" />
                          <TouchableOpacity onPress={() => handleAdjustWeight(unit === 'LBS' ? 5 : 2.5)} className="w-9 h-9 rounded-xl bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                            <Text className="text-brand-primary text-lg font-bold">+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Reps Box */}
                    <View className="flex-1 bg-brand-surface p-4 rounded-2xl border border-brand-surfaceBorder">
                      <Text className="text-content-secondary text-[10px] font-bold uppercase tracking-wider mb-2 text-center">Reps</Text>
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => handleAdjustReps(-1)} className="w-9 h-9 rounded-xl bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                          <Text className="text-brand-primary text-lg font-bold">-</Text>
                        </TouchableOpacity>
                        <TextInput value={repsText} onChangeText={setRepsText} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.content.muted} className="flex-1 text-center text-brand-primary text-xl font-extrabold mx-1" />
                        <TouchableOpacity onPress={() => handleAdjustReps(1)} className="w-9 h-9 rounded-xl bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                          <Text className="text-brand-primary text-lg font-bold">+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* RPE Box (Obligatorio) */}
                    <View className="flex-1 bg-brand-surface p-4 rounded-2xl border border-brand-surfaceBorder">
                      <Text className="text-content-secondary text-[10px] font-bold uppercase tracking-wider mb-2 text-center">RPE (1-10)</Text>
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={() => handleAdjustRpe(-0.5)} className="w-9 h-9 rounded-xl bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                          <Text className="text-brand-primary text-lg font-bold">-</Text>
                        </TouchableOpacity>
                        <TextInput value={rpeText} onChangeText={setRpeText} keyboardType="decimal-pad" placeholder="8" placeholderTextColor={Colors.content.muted} className="flex-1 text-center text-brand-primary text-xl font-extrabold mx-1" />
                        <TouchableOpacity onPress={() => handleAdjustRpe(0.5)} className="w-9 h-9 rounded-xl bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                          <Text className="text-brand-primary text-lg font-bold">+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity activeOpacity={0.85} onPress={handleSaveSet} className="w-full bg-brand-primary py-5 rounded-2xl flex-row items-center justify-center shadow-lg">
                  <Ionicons name="checkmark" size={24} color={Colors.brand.background} />
                  <Text className="text-brand-background text-lg font-bold ml-2">Save Set</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ════ PHASE D: COMPLETED ════ */}
            {phase === 'COMPLETED' && (
              <View className="flex-1 justify-between py-2">
                <View>
                  <View className="items-center my-6">
                    <View className="w-24 h-24 rounded-full bg-status-info/20 items-center justify-center border-2 border-status-info/40 mb-4">
                      <Ionicons name="trophy-outline" size={48} color={Colors.status.infoLight} />
                    </View>
                    <Text className="text-3xl font-black text-brand-primary text-center">Exercise Completed!</Text>
                    <Text className="text-content-secondary text-sm text-center mt-2">All {exercise.sets.length} sets logged successfully.</Text>
                  </View>

                  <View className="w-full bg-brand-surface rounded-2xl p-5 mb-4 border border-brand-surfaceBorder">
                    <Text className="text-content-secondary text-xs font-bold uppercase tracking-wider mb-3">Summary of Sets</Text>
                    {exercise.sets.map((s, idx) => (
                      <View key={idx} className="flex-row items-center justify-between py-3 border-b border-brand-surfaceBorder/40 last:border-b-0">
                        <View className="flex-row items-center">
                          <View className="w-8 h-8 rounded-full bg-status-info/20 items-center justify-center mr-3">
                            <Text className="text-status-infoLight text-sm font-bold">{s.setNumber}</Text>
                          </View>
                          <Text className="text-brand-primary text-base font-semibold">Set {s.setNumber}</Text>
                        </View>
                        <Text className="text-content-secondary text-sm font-semibold">
                          {s.weight !== null && s.weight !== undefined && s.weight > 0 ? `${s.weight} kg` : 'BW'} × {s.reps ?? 0} reps (RPE {s.rpe ?? 8})
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="w-full gap-4 mt-5">
                  {!isLastExercise && nextExerciseName ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={handleNextExercise} className="w-full bg-brand-primary py-5 rounded-2xl flex-row items-center justify-center shadow-lg">
                      <Text className="text-brand-background text-lg font-bold mr-2">Next Exercise: {nextExerciseName}</Text>
                      <Ionicons name="arrow-forward" size={20} color={Colors.brand.background} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity activeOpacity={0.8} onPress={onClose} className={`w-full py-5 rounded-2xl flex-row items-center justify-center ${!isLastExercise && nextExerciseName ? 'bg-brand-surface border border-brand-surfaceBorder' : 'bg-brand-primary shadow-lg'}`}>
                    <Text className={`text-lg font-bold ${!isLastExercise && nextExerciseName ? 'text-brand-primary' : 'text-brand-background'}`}>Back to Overview</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={handleAddAnotherSet} className="w-full py-3 items-center justify-center">
                    <Text className="text-status-infoLight text-sm font-bold uppercase tracking-wider">+ Add Another Set</Text>
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