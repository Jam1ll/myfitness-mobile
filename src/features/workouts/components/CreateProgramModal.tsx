import { workoutApi } from '@/api/workoutApi';
import AppText from '@/components/common/AppText';
import type {
  CreateWeeklyProgramRequest,
  DayOfWeek,
  ProgramDayItemDto,
  UpdateWeeklyProgramRequest,
  WeeklyProgramResponse,
} from '@/features/workouts/types';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DAYS_OF_WEEK: { labelKey: string; defaultLabel: string; value: DayOfWeek }[] = [
  { labelKey: 'home.weekDays.mon', defaultLabel: 'Monday', value: 'MONDAY' },
  { labelKey: 'home.weekDays.tue', defaultLabel: 'Tuesday', value: 'TUESDAY' },
  { labelKey: 'home.weekDays.wed', defaultLabel: 'Wednesday', value: 'WEDNESDAY' },
  { labelKey: 'home.weekDays.thu', defaultLabel: 'Thursday', value: 'THURSDAY' },
  { labelKey: 'home.weekDays.fri', defaultLabel: 'Friday', value: 'FRIDAY' },
  { labelKey: 'home.weekDays.sat', defaultLabel: 'Saturday', value: 'SATURDAY' },
  { labelKey: 'home.weekDays.sun', defaultLabel: 'Sunday', value: 'SUNDAY' },
];

type RoutineOption = { id: string; name: string };

interface CreateProgramModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: WeeklyProgramResponse | null;
}

export default function CreateProgramModal({
  isVisible,
  onClose,
  onSaved,
  initialData,
}: CreateProgramModalProps) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useTranslation();

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

  const [pickingDay, setPickingDay] = useState<DayOfWeek | null>(null);

  const { data: routinesPage, isLoading: loadingRoutines } = useQuery({
    queryKey: ['routines', 'all'],
    queryFn: () => workoutApi.getRoutines({ page: 0, size: 100, mineOnly: false, search: '' }),
    enabled: isVisible,
  });

  const routineOptions = useMemo<RoutineOption[]>(() => {
    return (routinesPage?.content ?? []).map((r) => ({
      id: r.id,
      name: r.name,
    }));
  }, [routinesPage]);

  const saveProgramMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: string;
      payload: CreateWeeklyProgramRequest | UpdateWeeklyProgramRequest;
    }) => {
      if (id) {
        return workoutApi.updateProgram(id, payload as UpdateWeeklyProgramRequest);
      }
      return workoutApi.createProgram(payload as CreateWeeklyProgramRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', 'active'] });
      onSaved();
      onClose();
    },
    onError: (error) => {
      console.error('Error saving program:', error);
      Alert.alert(t('common.error'), t('programs.saveError'));
    },
  });

  useEffect(() => {
    if (!isVisible) return;

    queueMicrotask(() => {
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
    });
  }, [isVisible, initialData]);

  const assignRoutineToDay = (day: DayOfWeek, routineId: string | null) => {
    setDayAssignments((prev) => ({ ...prev, [day]: routineId }));
    setPickingDay(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('programs.nameRequired'));
      return;
    }

    const programDays: ProgramDayItemDto[] = Object.entries(dayAssignments)
      .filter(([, routineId]) => routineId !== null)
      .map(([dayOfWeek, routineId]) => ({
        dayOfWeek: dayOfWeek as DayOfWeek,
        routineId: routineId!,
      }));

    if (programDays.length === 0) {
      Alert.alert(t('common.error'), t('programs.dayRequired'));
      return;
    }

    if (initialData) {
      saveProgramMutation.mutate({
        id: initialData.id,
        payload: {
          name: name.trim(),
          programDays,
          weeklyProgramActive,
        },
      });
    } else {
      saveProgramMutation.mutate({
        payload: {
          name: name.trim(),
          programDays,
          weeklyProgramActive: false,
        },
      });
    }
  };

  const getRoutineName = (routineId: string | null): string => {
    if (!routineId) return t('programs.restDay');
    return routineOptions.find((r) => r.id === routineId)?.name ?? t('programs.unknownRoutine');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          style={{ backgroundColor: colors.brand.background + 'B3' }}
          className="absolute inset-0"
          onPress={onClose}
        />

        <View
          style={{ backgroundColor: colors.brand.surface }}
          className="rounded-t-3xl px-6 pt-3 pb-10 max-h-[90%] min-h-[80%]"
        >
          {/* Drag indicator */}
          <View className="items-center mb-4">
            <View
              style={{ backgroundColor: colors.brand.muted }}
              className="w-12 h-1.5 rounded-full"
            />
          </View>

          <AppText
            weight="bold"
            style={{ color: colors.brand.primary }}
            className="text-2xl font-bold mb-4"
          >
            {initialData ? t('programs.editProgram') : t('programs.createProgram')}
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Program name */}
            <AppText
              weight="bold"
              style={{ color: colors.content.secondary }}
              className="text-xs font-semibold mb-1 uppercase tracking-wider"
            >
              {t('programs.programNameLabel')}
            </AppText>
            <TextInput
              placeholder={t('programs.programNamePlaceholder')}
              placeholderTextColor={colors.content.muted}
              value={name}
              onChangeText={setName}
              style={{
                backgroundColor: colors.brand.background,
                color: colors.brand.primary,
                borderColor: colors.brand.surfaceBorder,
              }}
              className="text-base px-4 py-3.5 rounded-xl border mb-6"
            />

            {/* Active program toggle (only when editing) */}
            {initialData && (
              <View
                style={{
                  backgroundColor: colors.brand.background,
                  borderColor: colors.brand.surfaceBorder,
                }}
                className="flex-row items-center justify-between p-4 rounded-xl border mb-6"
              >
                <View className="flex-1 mr-4">
                  <AppText
                    weight="bold"
                    style={{ color: colors.brand.primary }}
                    className="font-semibold text-base"
                  >
                    {t('programs.activeProgram')}
                  </AppText>
                  <AppText
                    style={{ color: colors.content.tertiary }}
                    className="text-xs mt-0.5"
                  >
                    {t('programs.activeProgramDescription')}
                  </AppText>
                </View>
                <Switch
                  value={weeklyProgramActive}
                  onValueChange={setWeeklyProgramActive}
                  trackColor={{ false: colors.brand.surfaceBorder, true: colors.status.info }}
                  thumbColor={colors.brand.primary}
                />
              </View>
            )}

            {/* Day-by-day assignment */}
            <AppText
              weight="bold"
              style={{ color: colors.brand.primary }}
              className="text-lg font-bold mb-3"
            >
              {t('programs.weeklySchedule')}
            </AppText>

            {loadingRoutines ? (
              <ActivityIndicator color={colors.brand.primary} size="small" className="my-6" />
            ) : (
              DAYS_OF_WEEK.map(({ labelKey, defaultLabel, value }) => {
                const assignedId = dayAssignments[value];
                const isExpanded = pickingDay === value;
                const dayLabel = t(labelKey, { defaultValue: defaultLabel });

                return (
                  <View key={value} className="mb-3">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setPickingDay(isExpanded ? null : value)}
                      style={{
                        backgroundColor: colors.brand.background,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="rounded-xl border p-4 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1">
                        <View
                          style={{ backgroundColor: colors.brand.surfaceAlt }}
                          className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        >
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-xs font-bold"
                          >
                            {dayLabel.substring(0, 2)}
                          </AppText>
                        </View>
                        <View className="flex-1">
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="font-semibold text-base"
                          >
                            {dayLabel}
                          </AppText>
                          <AppText
                            style={{
                              color: assignedId
                                ? colors.status.infoLight
                                : colors.content.muted,
                            }}
                            className="text-xs mt-0.5"
                            numberOfLines={1}
                          >
                            {getRoutineName(assignedId)}
                          </AppText>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        {assignedId && (
                          <TouchableOpacity
                            onPress={() => assignRoutineToDay(value, null)}
                            className="mr-2 p-1"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="close-circle"
                              size={18}
                              color={colors.content.muted}
                            />
                          </TouchableOpacity>
                        )}
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.content.tertiary}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expandable routine picker */}
                    {isExpanded && (
                      <View
                        style={{
                          backgroundColor: colors.brand.surfaceAlt + '80',
                          borderColor: colors.brand.surfaceBorder,
                        }}
                        className="rounded-b-xl border border-t-0 px-2 py-2 -mt-1"
                      >
                        {routineOptions.length === 0 ? (
                          <AppText
                            style={{ color: colors.content.tertiary }}
                            className="text-sm text-center py-4"
                          >
                            {t('programs.noRoutinesAvailable')}
                          </AppText>
                        ) : (
                          routineOptions.map((routine) => {
                            const isSelected = assignedId === routine.id;
                            return (
                              <TouchableOpacity
                                key={routine.id}
                                activeOpacity={0.7}
                                onPress={() => assignRoutineToDay(value, routine.id)}
                                style={{
                                  backgroundColor: isSelected
                                    ? colors.brand.primary + '1A'
                                    : 'transparent',
                                }}
                                className="flex-row items-center justify-between p-3 rounded-lg mb-1"
                              >
                                <AppText
                                  weight={isSelected ? 'bold' : 'regular'}
                                  style={{
                                    color: isSelected
                                      ? colors.brand.primary
                                      : colors.content.secondary,
                                  }}
                                  className="text-sm font-medium"
                                  numberOfLines={1}
                                >
                                  {routine.name}
                                </AppText>
                                {isSelected && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color={colors.status.info}
                                  />
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
            disabled={saveProgramMutation.isPending}
            style={{ backgroundColor: colors.brand.primary }}
            className="rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            {saveProgramMutation.isPending ? (
              <ActivityIndicator color={colors.brand.background} size="small" />
            ) : (
              <AppText
                weight="bold"
                style={{ color: colors.brand.background }}
                className="text-base font-semibold"
              >
                {initialData ? t('programs.saveChanges') : t('programs.createProgram')}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
