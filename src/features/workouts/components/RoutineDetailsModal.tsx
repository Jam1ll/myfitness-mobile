import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export type ExerciseSummaryDto = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
};

export type WorkoutDetailResponse = {
  id: string;
  name: string;
  exercises: ExerciseSummaryDto[];
  workoutPrivate: boolean;
  createdBy: string;
  createdAt: string;
  workoutOwner: boolean;
};

interface RoutineDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  workout: WorkoutDetailResponse | null;
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (workout: WorkoutDetailResponse) => void;
}

export default function RoutineDetailsModal({ isVisible, onClose, workout, loading, onDelete, onEdit }: RoutineDetailsProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/70" onPress={onClose} />

        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-3 pb-10 min-h-[60%] max-h-[90%]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 rounded-full bg-zinc-600" />
          </View>

          {loading || !workout ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color="#ffffff" size="large" />
              <Text className="text-gray-400 mt-4">Loading routine...</Text>
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-400 text-sm">
                  Created by {workout.createdBy === 'System' ? 'System' : 'You'}
                </Text>
                <View className="flex-row items-center bg-zinc-800/50 rounded-full px-3 py-1">
                  <Ionicons
                    name={workout.workoutPrivate ? "lock-closed" : "globe-outline"}
                    size={14}
                    color={workout.workoutPrivate ? "#f87171" : "#60a5fa"}
                  />
                  <Text className="text-gray-400 text-xs ml-1.5">
                    {workout.workoutPrivate ? 'Private' : 'Public'}
                  </Text>
                </View>
              </View>

              <Text className="text-white text-3xl font-bold mb-6">{workout.name}</Text>
              <Text className="text-white text-lg font-semibold mb-4">
                Exercises ({workout.exercises?.length || 0})
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
                {!workout.exercises || workout.exercises.length === 0 ? (
                  <Text className="text-gray-500 italic mt-2">No exercises added to this routine yet.</Text>
                ) : (
                  workout.exercises.map((ex: ExerciseSummaryDto, index: number) => (
                    <View key={`${ex.id}-${index}`} className="bg-zinc-800/50 rounded-xl p-4 mb-3 border border-zinc-800/80">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-white text-base font-semibold">{ex.name}</Text>
                        <Text className="text-xs text-gray-500 bg-zinc-800 px-2 py-1 rounded">{ex.muscleGroup}</Text>
                      </View>
                      {ex.description ? (
                        <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>{ex.description}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Botones */}
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-white text-base font-semibold">Close</Text>
                </TouchableOpacity>

                {/* Botones Edit/Delete */}
                {workout.workoutOwner && (
                  <>
                    {onEdit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onEdit(workout)}
                        className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="pencil" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                    {onDelete && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onDelete(workout.id)}
                        className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
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