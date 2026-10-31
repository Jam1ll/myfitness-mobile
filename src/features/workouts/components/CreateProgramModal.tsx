import { axiosClient } from '@/api/axiosClient';
import type {
  CreateWeeklyProgramRequest,
  DayOfWeek,
  ProgramDayItemDto,
  UpdateWeeklyProgramRequest,
  WeeklyProgramResponse,
} from '@/features/workouts/types';
import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Constants ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK: { label: string; value: DayOfWeek }[] = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
];

type RoutineOption = { id: string; name: string };

// ─── Props ──────────────────────────────────────────────────────────────────

interface CreateProgramModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: WeeklyProgramResponse | null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CreateProgramModal({
  isVisible,
  onClose,
  onSaved,
  initialData,
}: CreateProgramModalProps) {
  const [name, setName] = useState('');
  const [weeklyProgramActive, setWeeklyProgramActive] = useState(false);
  const [dayAssignments, setDayAssignments] = useState<Record<DayOfWeek, string | null>>({
    MONDAY: null,
    TUESDAY: null,
    WEDNESDAY: null,
    THURSDAY: null,
    FRIDAY: null,
    SATURDAY: null,
    SUNDAY: null,
  });

  const [routineOptions, setRoutineOptions] = useState<RoutineOption[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // The day currently showing the routine picker
  const [pickingDay, setPickingDay] = useState<DayOfWeek | null>(null);

  // ── Load user routines when modal opens ─────────────────────────────────

  const fetchUserRoutines = async () => {
    setLoadingRoutines(true);
    try {
      const response = await axiosClient.get('/workouts/routines?page=0&size=100&mineOnly=false&search=');
      const items = (response.data.content ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
      }));
      setRoutineOptions(items);
    } catch {
      Alert.alert('Error', 'Could not load your routines.');
    } finally {
      setLoadingRoutines(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchUserRoutines();

      if (initialData) {
        setName(initialData.name);
        setWeeklyProgramActive(initialData.weeklyProgramActive ?? false);
        const assignments: Record<DayOfWeek, string | null> = {
          MONDAY: null,
          TUESDAY: null,
          WEDNESDAY: null,
          THURSDAY: null,
          FRIDAY: null,
          SATURDAY: null,
          SUNDAY: null,
        };
        initialData.programDays.forEach((pd) => {
          assignments[pd.dayOfWeek] = pd.routineId;
        });
        setDayAssignments(assignments);
      } else {
        setName('');
        setWeeklyProgramActive(false);
        setDayAssignments({
          MONDAY: null,
          TUESDAY: null,
          WEDNESDAY: null,
          THURSDAY: null,
          FRIDAY: null,
          SATURDAY: null,
          SUNDAY: null,
        });
      }
    }
  }, [isVisible, initialData]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const assignRoutineToDay = (day: DayOfWeek, routineId: string | null) => {
    setDayAssignments((prev) => ({ ...prev, [day]: routineId }));
    setPickingDay(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a program name.');
      return;
    }

    const programDays: ProgramDayItemDto[] = Object.entries(dayAssignments)
      .filter(([, routineId]) => routineId !== null)
      .map(([dayOfWeek, routineId]) => ({
        dayOfWeek: dayOfWeek as DayOfWeek,
        routineId: routineId!,
      }));

    if (programDays.length === 0) {
      Alert.alert('Error', 'Please assign a routine to at least one day.');
      return;
    }

    setIsSaving(true);
    try {
      if (initialData) {
        const updatePayload: UpdateWeeklyProgramRequest = {
          name: name.trim(),
          programDays,
          weeklyProgramActive,
        };
        await axiosClient.put(`/workouts/programs/${initialData.id}`, updatePayload);
      } else {
        const createPayload: CreateWeeklyProgramRequest = {
          name: name.trim(),
          programDays,
        };
        await axiosClient.post('/workouts/programs', createPayload);
      }
      onSaved();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not save the program. Check the Expo console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  const getRoutineName = (routineId: string | null): string => {
    if (!routineId) return 'Rest day';
    return routineOptions.find((r) => r.id === routineId)?.name ?? 'Unknown routine';
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-brand-background/80" onPress={onClose} />

        <View className="bg-brand-surface rounded-t-3xl px-6 pt-3 pb-10 max-h-[90%] min-h-[80%]">
          {/* Drag indicator */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 rounded-full bg-brand-muted" />
          </View>

          <Text className="text-brand-primary text-2xl font-bold mb-4">
            {initialData ? 'Edit Program' : 'Create Program'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Program name */}
            <Text className="text-content-secondary text-xs font-semibold mb-1 uppercase tracking-wider">
              Program Name
            </Text>
            <TextInput
              placeholder="e.g. Push / Pull / Legs"
              placeholderTextColor={Colors.content.muted}
              value={name}
              onChangeText={setName}
              className="bg-brand-background text-brand-primary text-base px-4 py-3.5 rounded-xl border border-brand-surfaceBorder mb-6"
            />

            {/* Active program toggle (only when editing) */}
            {initialData && (
              <View className="flex-row items-center justify-between bg-brand-background p-4 rounded-xl border border-brand-surfaceBorder mb-6">
                <View className="flex-1 mr-4">
                  <Text className="text-brand-primary font-semibold text-base">Active Program</Text>
                  <Text className="text-content-tertiary text-xs mt-0.5">
                    Set this as your currently active weekly training program
                  </Text>
                </View>
                <Switch
                  value={weeklyProgramActive}
                  onValueChange={setWeeklyProgramActive}
                  trackColor={{ false: Colors.brand.surfaceBorder, true: Colors.status.info }}
                  thumbColor={Colors.brand.primary}
                />
              </View>
            )}

            {/* Day-by-day assignment */}
            <Text className="text-brand-primary text-lg font-bold mb-3">Weekly Schedule</Text>

            {loadingRoutines ? (
              <ActivityIndicator color={Colors.brand.primary} size="small" className="my-6" />
            ) : (
              DAYS_OF_WEEK.map(({ label, value }) => {
                const assignedId = dayAssignments[value];
                const isExpanded = pickingDay === value;

                return (
                  <View key={value} className="mb-3">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setPickingDay(isExpanded ? null : value)}
                      className="bg-brand-background rounded-xl border border-brand-surfaceBorder p-4 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 rounded-full bg-brand-surfaceAlt items-center justify-center mr-3">
                          <Text className="text-brand-primary text-xs font-bold">
                            {label.substring(0, 2)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-brand-primary font-semibold text-base">{label}</Text>
                          <Text
                            className={`text-xs mt-0.5 ${assignedId ? 'text-status-infoLight' : 'text-content-muted'}`}
                            numberOfLines={1}
                          >
                            {getRoutineName(assignedId)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        {assignedId && (
                          <TouchableOpacity
                            onPress={() => assignRoutineToDay(value, null)}
                            className="mr-2 p-1"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="close-circle" size={18} color={Colors.content.muted} />
                          </TouchableOpacity>
                        )}
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={Colors.content.tertiary}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expandable routine picker */}
                    {isExpanded && (
                      <View className="bg-brand-surfaceAlt/50 rounded-b-xl border border-t-0 border-brand-surfaceBorder px-2 py-2 -mt-1">
                        {routineOptions.length === 0 ? (
                          <Text className="text-content-tertiary text-sm text-center py-4">
                            No routines available. Create one first!
                          </Text>
                        ) : (
                          routineOptions.map((routine) => {
                            const isSelected = assignedId === routine.id;
                            return (
                              <TouchableOpacity
                                key={routine.id}
                                activeOpacity={0.7}
                                onPress={() => assignRoutineToDay(value, routine.id)}
                                className={`flex-row items-center justify-between p-3 rounded-lg mb-1 ${isSelected ? 'bg-brand-primary/10' : ''
                                  }`}
                              >
                                <Text
                                  className={`text-sm font-medium ${isSelected ? 'text-brand-primary' : 'text-content-secondary'
                                    }`}
                                  numberOfLines={1}
                                >
                                  {routine.name}
                                </Text>
                                {isSelected && (
                                  <Ionicons name="checkmark-circle" size={18} color={Colors.status.info} />
                                )}
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSaving}
            className="bg-brand-primary rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.brand.background} size="small" />
            ) : (
              <Text className="text-brand-background text-base font-semibold">
                {initialData ? 'Save Changes' : 'Create Program'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
