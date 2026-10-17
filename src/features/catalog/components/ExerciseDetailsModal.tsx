import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export type ExerciseResponse = {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  exercisePrivate: boolean;
  exerciseOwner: boolean;
};

interface ExerciseDetailsProps {
  isVisible: boolean;
  onClose: () => void;
  exercise: ExerciseResponse | null;
  loading: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (exercise: ExerciseResponse) => void;
}

export default function ExerciseDetailsModal({ isVisible, onClose, exercise, loading, onDelete, onEdit }: ExerciseDetailsProps) {
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/70" onPress={onClose} />
        
        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-3 pb-10 min-h-[50%] max-h-[85%]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 rounded-full bg-zinc-600" />
          </View>

          {loading || !exercise ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color="#ffffff" size="large" />
              <Text className="text-gray-400 mt-4">Loading details...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-zinc-800 rounded-lg px-3 py-1.5">
                  <Text className="text-gray-300 font-medium">{exercise.muscleGroup}</Text>
                </View>
                <View className="flex-row items-center bg-zinc-800/50 rounded-full px-3 py-1">
                  <Ionicons 
                    name={exercise.exercisePrivate ? "lock-closed" : "globe-outline"} 
                    size={14} 
                    color={exercise.exercisePrivate ? "#f87171" : "#60a5fa"} 
                  />
                  <Text className="text-gray-400 text-xs ml-1.5">
                    {exercise.exercisePrivate ? 'Private' : 'Public'}
                  </Text>
                </View>
              </View>

              <Text className="text-white text-3xl font-bold mb-4">
                {exercise.name}
              </Text>

              {exercise.exerciseOwner && (
                <View className="mb-6 flex-row items-center">
                  <Ionicons name="person-circle-outline" size={20} color="#a1a1aa" />
                  <Text className="text-gray-400 ml-2">Created by you</Text>
                </View>
              )}

              <Text className="text-white text-base leading-relaxed mb-8">
                {exercise.description}
              </Text>

              {/* Contenedor de Botones */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-white text-base font-semibold">Close</Text>
                </TouchableOpacity>

                {/* Botones Edit/Delete (solo si es el dueño) */}
                {exercise.exerciseOwner && (
                  <>
                    {onEdit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onEdit(exercise)}
                        className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="pencil" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                    {onDelete && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onDelete(exercise.id)}
                        className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}