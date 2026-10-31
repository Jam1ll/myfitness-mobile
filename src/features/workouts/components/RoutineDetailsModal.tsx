import type { RoutineDetailResponse } from '@/features/workouts/types';
import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface RoutineDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  routine: RoutineDetailResponse | null;
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (routine: RoutineDetailResponse) => void;
}

export default function RoutineDetailsModal({ isVisible, onClose, routine, loading, onDelete, onEdit }: RoutineDetailsProps) {
  const exercises = routine?.enrichedRoutineExercises ?? [];

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-brand-background/70" onPress={onClose} />

        <View className="bg-brand-surface rounded-t-3xl px-6 pt-3 pb-10 min-h-[60%] max-h-[90%]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 rounded-full bg-brand-muted" />
          </View>

          {loading || !routine ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color={Colors.brand.primary} size="large" />
              <Text className="text-content-secondary mt-4">Loading routine...</Text>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-content-secondary text-sm">
                  Created by {routine.createdBy || 'Unknown'}
                </Text>
                <View className="flex-row items-center bg-brand-surfaceAlt/50 rounded-full px-3 py-1">
                  <Ionicons
                    name={routine.routinePrivate ? "lock-closed" : "globe-outline"}
                    size={14}
                    color={routine.routinePrivate ? Colors.status.dangerLight : Colors.status.infoLight}
                  />
                  <Text className="text-content-secondary text-xs ml-1.5">
                    {routine.routinePrivate ? 'Private' : 'Public'}
                  </Text>
                </View>
              </View>

              <Text className="text-brand-primary text-3xl font-bold mb-6">{routine.name}</Text>
              <Text className="text-brand-primary text-lg font-semibold mb-4">
                Exercises ({exercises.length})
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
                {exercises.length === 0 ? (
                  <Text className="text-content-tertiary italic mt-2">No exercises added to this routine yet.</Text>
                ) : (
                  exercises.map((ex, index) => (
                    <View key={`${ex.exerciseId}-${index}`} className="bg-brand-surfaceAlt/50 rounded-xl p-4 mb-3 border border-brand-surfaceBorder">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-brand-primary text-base font-semibold">{ex.name || 'Exercise'}</Text>
                        {ex.muscleGroup ? (
                          <Text className="text-xs text-content-tertiary bg-brand-surfaceAlt px-2 py-1 rounded">{ex.muscleGroup}</Text>
                        ) : null}
                      </View>

                      {ex.description ? (
                        <Text className="text-content-secondary text-xs mb-2" numberOfLines={2}>{ex.description}</Text>
                      ) : null}

                      <View className="flex-row gap-4 mt-2 pt-2 border-t border-brand-borderMuted/50">
                        <Text className="text-content-secondary text-xs">Sets: <Text className="text-brand-primary font-bold">{ex.targetSets ?? 0}</Text></Text>
                        <Text className="text-content-secondary text-xs">Reps: <Text className="text-brand-primary font-bold">{ex.targetReps ?? 0}</Text></Text>
                        <Text className="text-content-secondary text-xs">Rest: <Text className="text-brand-primary font-bold">{ex.restTimeSeconds ?? 0}s</Text></Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Botones */}
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  className="flex-1 bg-brand-surfaceAlt border border-brand-borderMuted rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-brand-primary text-base font-semibold">Close</Text>
                </TouchableOpacity>

                {routine.routineOwner && (
                  <>
                    {onEdit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onEdit(routine)}
                        className="bg-status-info/10 border border-status-info/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="pencil" size={20} color={Colors.status.info} />
                      </TouchableOpacity>
                    )}
                    {onDelete && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onDelete(routine.id)}
                        className="bg-status-danger/10 border border-status-danger/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={20} color={Colors.status.danger} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}