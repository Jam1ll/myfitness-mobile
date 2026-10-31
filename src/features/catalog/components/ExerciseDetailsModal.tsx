import { Colors } from '@/theme/colors';
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
        <Pressable className="absolute inset-0 bg-brand-background/70" onPress={onClose} />
        
        <View className="bg-brand-surface rounded-t-3xl px-6 pt-3 pb-10 min-h-[50%] max-h-[85%]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 rounded-full bg-brand-muted" />
          </View>

          {loading || !exercise ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator color={Colors.brand.primary} size="large" />
              <Text className="text-content-secondary mt-4">Loading details...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-brand-surfaceAlt rounded-lg px-3 py-1.5">
                  <Text className="text-content-secondary font-medium">{exercise.muscleGroup}</Text>
                </View>
                <View className="flex-row items-center bg-brand-surfaceAlt/50 rounded-full px-3 py-1">
                  <Ionicons 
                    name={exercise.exercisePrivate ? "lock-closed" : "globe-outline"} 
                    size={14} 
                    color={exercise.exercisePrivate ? Colors.status.dangerLight : Colors.status.infoLight} 
                  />
                  <Text className="text-content-secondary text-xs ml-1.5">
                    {exercise.exercisePrivate ? 'Private' : 'Public'}
                  </Text>
                </View>
              </View>

              <Text className="text-brand-primary text-3xl font-bold mb-4">
                {exercise.name}
              </Text>

              {exercise.exerciseOwner && (
                <View className="mb-6 flex-row items-center">
                  <Ionicons name="person-circle-outline" size={20} color={Colors.content.secondary} />
                  <Text className="text-content-secondary ml-2">Created by you</Text>
                </View>
              )}

              <Text className="text-brand-primary text-base leading-relaxed mb-8">
                {exercise.description}
              </Text>

              {/* Contenedor de Botones */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  className="flex-1 bg-brand-surfaceAlt border border-brand-borderMuted rounded-xl py-4 flex-row items-center justify-center"
                >
                  <Text className="text-brand-primary text-base font-semibold">Close</Text>
                </TouchableOpacity>

                {/* Botones Edit/Delete (solo si es el dueño) */}
                {exercise.exerciseOwner && (
                  <>
                    {onEdit && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onEdit(exercise)}
                        className="bg-status-info/10 border border-status-info/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="pencil" size={20} color={Colors.status.info} />
                      </TouchableOpacity>
                    )}
                    {onDelete && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onDelete(exercise.id)}
                        className="bg-status-danger/10 border border-status-danger/30 rounded-xl px-4 py-4 flex-row items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={20} color={Colors.status.danger} />
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