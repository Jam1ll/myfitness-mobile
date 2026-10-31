import { Colors } from '@/theme/colors';
import CreateProgramModal from '@/features/workouts/components/CreateProgramModal';
import type { DayOfWeek, WeeklyProgramResponse } from '@/features/workouts/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { axiosClient } from '../../api/axiosClient';

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

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function ProgramsScreen() {
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
      Alert.alert('Error', 'Could not load your programs.');
    } finally {
      setLoading(false);
    }
  }, []);

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
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosClient.delete(`/workouts/programs/${id}`);
              await fetchPrograms();
            } catch {
              Alert.alert('Error', 'Could not delete the program.');
            }
          },
        },
      ],
    );
  };

  // ── Render helpers ──────────────────────────────────────────────────────

  const renderDayPills = (program: WeeklyProgramResponse) => {
    const assignedDays = new Set(program.programDays.map((d) => d.dayOfWeek));

    return (
      <View className="flex-row flex-wrap gap-1.5 mt-3">
        {DAY_ORDER.map((day) => {
          const isAssigned = assignedDays.has(day);
          const programDay = program.programDays.find((d) => d.dayOfWeek === day);

          return (
            <View
              key={day}
              className={`px-2.5 py-1.5 rounded-lg ${
                isAssigned ? 'bg-status-info/15 border border-status-info/30' : 'bg-brand-surfaceAlt/50 border border-brand-surfaceBorder'
              }`}
            >
              <Text
                className={`text-[10px] font-bold uppercase ${
                  isAssigned ? 'text-status-infoLight' : 'text-content-disabled'
                }`}
              >
                {DAY_SHORT[day]}
              </Text>
              {isAssigned && programDay?.routineName && (
                <Text className="text-brand-primary text-[9px] mt-0.5" numberOfLines={1}>
                  {programDay.routineName}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={['top']}>
      <View className="px-6 mt-4 mb-2">
        <Text className="text-brand-primary text-3xl font-bold">Programs</Text>
        <Text className="text-content-secondary text-base mt-1">
          Weekly programs built from your routines
        </Text>
      </View>

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator className="mt-10" color={Colors.brand.primary} size="large" />
        ) : (
          <View className="pb-20">
            {programs.length === 0 ? (
              <View className="items-center justify-center mt-10 px-8">
                <Ionicons name="calendar-outline" size={48} color={Colors.brand.borderMuted} />
                <Text className="text-content-tertiary text-base mt-4 text-center">
                  No programs yet. Create one to organize your weekly training!
                </Text>
              </View>
            ) : (
              <View className="px-4 flex-col">
                {programs.map((program) => (
                  <View
                    key={program.id}
                    className="px-2 mb-4"
                  >
                    <View className="bg-brand-surface rounded-2xl p-5 border border-brand-surfaceBorder">
                      {/* Header */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-3">
                          <Text className="text-brand-primary text-xl font-bold" numberOfLines={1}>
                            {program.name}
                          </Text>
                          <Text className="text-content-tertiary text-xs mt-1">
                            {program.programDays.length} day{program.programDays.length !== 1 ? 's' : ''} assigned
                          </Text>
                        </View>

                        {program.programOwner && (
                          <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleEditProgram(program)}
                              className="w-9 h-9 rounded-full bg-status-info/10 items-center justify-center"
                            >
                              <Ionicons name="pencil" size={16} color={Colors.status.info} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleDeleteProgram(program.id)}
                              className="w-9 h-9 rounded-full bg-status-danger/10 items-center justify-center"
                            >
                              <Ionicons name="trash-outline" size={16} color={Colors.status.danger} />
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
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand-primary items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color={Colors.brand.background} />
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
