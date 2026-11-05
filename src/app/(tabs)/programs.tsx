import { axiosClient } from '../../api/axiosClient';
import AppText from '@/components/common/AppText';
import CreateProgramModal from '@/features/workouts/components/CreateProgramModal';
import type { DayOfWeek, WeeklyProgramResponse } from '@/features/workouts/types';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAY_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_KEY_MAP: Record<DayOfWeek, string> = {
  MONDAY: 'mon',
  TUESDAY: 'tue',
  WEDNESDAY: 'wed',
  THURSDAY: 'thu',
  FRIDAY: 'fri',
  SATURDAY: 'sat',
  SUNDAY: 'sun',
};

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ProgramsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [programs, setPrograms] = useState<WeeklyProgramResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<WeeklyProgramResponse | null>(null);

  // ── Fetch programs ──────────────────────────────────────────────────────

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/workouts/programs');
      setPrograms(response.data.content ?? response.data ?? []);
    } catch {
      Alert.alert(t('common.error'), t('programs.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setProgramToEdit(null);
    setIsCreateModalVisible(true);
  };

  const handleEditProgram = (program: WeeklyProgramResponse) => {
    setProgramToEdit(program);
    setIsCreateModalVisible(true);
  };

  const handleDeleteProgram = (id: string) => {
    Alert.alert(t('programs.deleteTitle'), t('programs.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await axiosClient.delete(`/workouts/programs/${id}`);
            await fetchPrograms();
          } catch {
            Alert.alert(t('common.error'), t('programs.deleteError'));
          }
        },
      },
    ]);
  };

  // ── Render helpers ──────────────────────────────────────────────────────

  const renderDayPills = (program: WeeklyProgramResponse) => {
    const assignedDays = new Set(program.programDays.map((d) => d.dayOfWeek));

    return (
      <View className="flex-row flex-wrap gap-1.5 mt-3">
        {DAY_ORDER.map((day) => {
          const isAssigned = assignedDays.has(day);
          const programDay = program.programDays.find((d) => d.dayOfWeek === day);
          const dayShort = t(`home.weekDays.${DAY_KEY_MAP[day]}`);

          return (
            <View
              key={day}
              style={{
                backgroundColor: isAssigned
                  ? colors.status.info + '20'
                  : colors.brand.surfaceAlt + '80',
                borderColor: isAssigned
                  ? colors.status.info + '40'
                  : colors.brand.surfaceBorder,
              }}
              className="px-2.5 py-1.5 rounded-lg border"
            >
              <AppText
                weight="bold"
                style={{
                  color: isAssigned ? colors.status.infoLight : colors.content.disabled,
                }}
                className="text-[10px] font-bold uppercase"
              >
                {dayShort}
              </AppText>
              {isAssigned && programDay?.routineName && (
                <AppText
                  style={{ color: colors.brand.primary }}
                  className="text-[9px] mt-0.5"
                  numberOfLines={1}
                >
                  {programDay.routineName}
                </AppText>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.brand.background }}
      className="flex-1"
      edges={['top']}
    >
      <View className="px-6 mt-4 mb-2">
        <AppText
          weight="bold"
          style={{ color: colors.brand.primary }}
          className="text-3xl font-bold"
        >
          {t('programs.title')}
        </AppText>
        <AppText
          style={{ color: colors.content.secondary }}
          className="text-base mt-1"
        >
          {t('programs.subtitle')}
        </AppText>
      </View>

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color={colors.brand.primary} size="large" />
        ) : (
          <View className="pb-20">
            {programs.length === 0 ? (
              <View className="items-center justify-center mt-10 px-8">
                <Ionicons name="calendar-outline" size={48} color={colors.brand.borderMuted} />
                <AppText
                  style={{ color: colors.content.tertiary }}
                  className="text-base mt-4 text-center"
                >
                  {t('programs.noPrograms')}
                </AppText>
              </View>
            ) : (
              <View className="px-4 flex-col">
                {programs.map((program) => (
                  <View key={program.id} className="px-2 mb-4">
                    <View
                      style={{
                        backgroundColor: colors.brand.surface,
                        borderColor: colors.brand.surfaceBorder,
                      }}
                      className="rounded-2xl p-5 border"
                    >
                      {/* Header */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-3">
                          <AppText
                            weight="bold"
                            style={{ color: colors.brand.primary }}
                            className="text-xl font-bold"
                            numberOfLines={1}
                          >
                            {program.name}
                          </AppText>
                          <AppText
                            style={{ color: colors.content.tertiary }}
                            className="text-xs mt-1"
                          >
                            {t('programs.daysAssigned', {
                              count: program.programDays.length,
                            })}
                          </AppText>
                        </View>

                        {program.programOwner && (
                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleEditProgram(program)}
                              style={{ backgroundColor: colors.status.info + '15' }}
                              className="w-9 h-9 rounded-full items-center justify-center"
                            >
                              <Ionicons name="pencil" size={16} color={colors.status.info} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleDeleteProgram(program.id)}
                              style={{ backgroundColor: colors.status.danger + '15' }}
                              className="w-9 h-9 rounded-full items-center justify-center"
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color={colors.status.danger}
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>

                      {/* Day pills */}
                      {renderDayPills(program)}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openCreateModal}
        style={{ backgroundColor: colors.brand.primary }}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color={colors.brand.background} />
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <CreateProgramModal
        isVisible={isCreateModalVisible}
        onClose={() => {
          setIsCreateModalVisible(false);
          setProgramToEdit(null);
        }}
        onSaved={fetchPrograms}
        initialData={programToEdit}
      />
    </SafeAreaView>
  );
}
