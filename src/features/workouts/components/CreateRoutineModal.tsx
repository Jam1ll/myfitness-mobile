import { axiosClient } from '@/api/axiosClient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ExerciseSelectorModal from './ExerciseSelectorModal'; // Asegúrate de tener la ruta correcta

export type WorkoutExerciseItem = {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restTimeSeconds: number;
  orderIndex: number;
};

export type CreateRoutinePayload = {
  name: string;
  workoutExerciseItems: WorkoutExerciseItem[];
  workoutPrivate: boolean;
};

interface CreateRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (payload: CreateRoutinePayload, id?: string) => void;
  isSaving: boolean;
  initialData?: any | null; // Puede tiparse con WorkoutDetailResponse
}

export default function CreateRoutineModal({ isVisible, onClose, onSave, isSaving, initialData }: CreateRoutineModalProps) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [routineExercises, setRoutineExercises] = useState<WorkoutExerciseItem[]>([]);
  
  // Catálogo detallado local para mostrar nombres de los ejercicios seleccionados
  const [exerciseDetailsMap, setExerciseDetailsMap] = useState<Record<string, { name: string; muscleGroup: string }>>({});
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setName(initialData.name || '');
        setIsPrivate(initialData.workoutPrivate ?? false);
        
        // Mapear los ejercicios estructurados existentes en caso de edición
        if (initialData.exercises) {
          const items: WorkoutExerciseItem[] = initialData.exercises.map((ex: any, idx: number) => ({
            exerciseId: ex.exerciseId || ex.id,
            targetSets: ex.targetSets ?? 3,
            targetReps: ex.targetReps ?? 10,
            restTimeSeconds: ex.restTimeSeconds ?? 60,
            orderIndex: ex.orderIndex ?? idx,
          }));
          setRoutineExercises(items);

          const map: Record<string, { name: string; muscleGroup: string }> = {};
          initialData.exercises.forEach((ex: any) => {
            map[ex.exerciseId || ex.id] = { name: ex.name, muscleGroup: ex.muscleGroup };
          });
          setExerciseDetailsMap(map);
        }
      } else {
        setName('');
        setIsPrivate(false);
        setRoutineExercises([]);
        setExerciseDetailsMap({});
      }
    }
  }, [isVisible, initialData]);

  // Manejar la selección desde el ExerciseSelectorModal
  const handleConfirmExercises = async (selectedIds: string[]) => {
    // Para cada ID seleccionado, verificamos si ya existe; si no, lo agregamos con valores por defecto
    const updatedItems: WorkoutExerciseItem[] = selectedIds.map((id, index) => {
      const existing = routineExercises.find(item => item.exerciseId === id);
      return existing || {
        exerciseId: id,
        targetSets: 3,
        targetReps: 10,
        restTimeSeconds: 60,
        orderIndex: index
      };
    });

    setRoutineExercises(updatedItems);

    // Opcional: Obtener detalles rápidos del catálogo para mostrar nombres en pantalla
    try {
      const response = await axiosClient.get('/exercises?page=0&size=100');
      const allExs = response.data.content || [];
      const map: Record<string, { name: string; muscleGroup: string }> = {};
      allExs.forEach((ex: any) => {
        if (selectedIds.includes(ex.id)) {
          map[ex.id] = { name: ex.name, muscleGroup: ex.muscleGroup };
        }
      });
      setExerciseDetailsMap(map);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateItemMeta = (exerciseId: string, field: keyof WorkoutExerciseItem, value: number) => {
    setRoutineExercises(prev =>
      prev.map(item => item.exerciseId === exerciseId ? { ...item, [field]: value } : item)
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setRoutineExercises(prev => prev.filter(item => item.exerciseId !== exerciseId));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a routine name.');
      return;
    }
    if (routineExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise.');
      return;
    }

    const payload: CreateRoutinePayload = {
      name: name.trim(),
      workoutExerciseItems: routineExercises.map((item, index) => ({
        ...item,
        orderIndex: index, // Asegurar orden secuencial
      })),
      workoutPrivate: isPrivate,
    };

    onSave(payload, initialData?.id);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/80" onPress={onClose} />

        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-3 pb-10 max-h-[90%] min-h-[80%]">
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 rounded-full bg-zinc-600" />
          </View>

          <Text className="text-white text-2xl font-bold mb-4">
            {initialData ? 'Edit Routine' : 'Create Routine'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Nombre de la rutina */}
            <Text className="text-gray-400 text-xs font-semibold mb-1 uppercase tracking-wider">Routine Name</Text>
            <TextInput
              placeholder="e.g. Upper Body Hypertrophy"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
              className="bg-black text-white text-base px-4 py-3.5 rounded-xl border border-zinc-800 mb-4"
            />

            {/* Privacidad */}
            <View className="flex-row items-center justify-between bg-black p-4 rounded-xl border border-zinc-800 mb-6">
              <View>
                <Text className="text-white font-semibold text-base">Private Routine</Text>
                <Text className="text-gray-500 text-xs">Only you will be able to see and use this routine</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#27272a', true: '#3b82f6' }}
                thumbColor={'#ffffff'}
              />
            </View>

            {/* Lista de Ejercicios Estructurados */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-bold">Exercises ({routineExercises.length})</Text>
              <TouchableOpacity
                onPress={() => setIsSelectorVisible(true)}
                className="bg-zinc-800 px-3 py-1.5 rounded-lg flex-row items-center"
              >
                <Ionicons name="add" size={16} color="#ffffff" className="mr-1" />
                <Text className="text-white text-xs font-semibold">Add Exercises</Text>
              </TouchableOpacity>
            </View>

            {routineExercises.length === 0 ? (
              <View className="bg-black border border-dashed border-zinc-800 rounded-xl p-6 items-center justify-center mb-4">
                <Text className="text-gray-500 text-sm">No exercises added yet.</Text>
              </View>
            ) : (
              routineExercises.map((item, index) => {
                const details = exerciseDetailsMap[item.exerciseId] || { name: 'Exercise', muscleGroup: '' };
                return (
                  <View key={item.exerciseId} className="bg-black border border-zinc-800 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>
                          {index + 1}. {details.name}
                        </Text>
                        <Text className="text-gray-500 text-xs">{details.muscleGroup}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveExercise(item.exerciseId)}>
                        <Ionicons name="trash-outline" size={18} color="#f87171" />
                      </TouchableOpacity>
                    </View>

                    {/* Inputs para Sets, Reps y Descanso */}
                    <View className="flex-row gap-2 mt-2 pt-2 border-t border-zinc-900">
                      <View className="flex-1">
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Sets</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.targetSets)}
                          onChangeText={(val) => handleUpdateItemMeta(item.exerciseId, 'targetSets', parseInt(val) || 0)}
                          className="bg-zinc-900 text-white text-center py-1.5 rounded-lg border border-zinc-800 text-sm font-semibold"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Reps</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.targetReps)}
                          onChangeText={(val) => handleUpdateItemMeta(item.exerciseId, 'targetReps', parseInt(val) || 0)}
                          className="bg-zinc-900 text-white text-center py-1.5 rounded-lg border border-zinc-800 text-sm font-semibold"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Rest (s)</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.restTimeSeconds)}
                          onChangeText={(val) => handleUpdateItemMeta(item.exerciseId, 'restTimeSeconds', parseInt(val) || 0)}
                          className="bg-zinc-900 text-white text-center py-1.5 rounded-lg border border-zinc-800 text-sm font-semibold"
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Botón de Guardar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSaving}
            className="bg-white rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            {isSaving ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text className="text-black text-base font-semibold">
                {initialData ? 'Save Changes' : 'Create Routine'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal Selector de Ejercicios */}
        <ExerciseSelectorModal
          isVisible={isSelectorVisible}
          onClose={() => setIsSelectorVisible(false)}
          onConfirm={handleConfirmExercises}
          initialSelectedIds={routineExercises.map(e => e.exerciseId)}
        />
      </View>
    </Modal>
  );
}