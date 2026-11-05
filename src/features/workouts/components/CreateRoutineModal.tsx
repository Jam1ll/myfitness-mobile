import { axiosClient } from '@/api/axiosClient';
import type { CreateRoutinePayload, RoutineDetailResponse, RoutineExerciseItemDto } from '@/features/workouts/types';
import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ExerciseSelectorModal from './ExerciseSelectorModal';

interface CreateRoutineModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (payload: CreateRoutinePayload, id?: string) => void;
  isSaving: boolean;
  initialData?: RoutineDetailResponse | null;
}

export default function CreateRoutineModal({ isVisible, onClose, onSave, isSaving, initialData }: CreateRoutineModalProps) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [routineExercises, setRoutineExercises] = useState<RoutineExerciseItemDto[]>([]);

  // Catálogo detallado local para mostrar nombres de los ejercicios seleccionados
  const [exerciseDetailsMap, setExerciseDetailsMap] = useState<Record<string, { name: string; muscleGroup: string }>>({});
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setName(initialData.name || '');
        setIsPrivate(initialData.routinePrivate ?? false);

        // Mapear los ejercicios estructurados existentes en caso de edición
        if (initialData.enrichedRoutineExercises) {
          const items: RoutineExerciseItemDto[] = initialData.enrichedRoutineExercises.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            targetSets: ex.targetSets ?? 3,
            targetReps: ex.targetReps ?? 10,
            restTimeSeconds: ex.restTimeSeconds ?? 60,
            orderIndex: ex.orderIndex ?? idx,
          }));
          setRoutineExercises(items);

          const map: Record<string, { name: string; muscleGroup: string }> = {};
          initialData.enrichedRoutineExercises.forEach((ex) => {
            map[ex.exerciseId] = { name: ex.name, muscleGroup: ex.muscleGroup };
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
    const updatedItems: RoutineExerciseItemDto[] = selectedIds.map((id, index) => {
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

  const handleUpdateItemMeta = (exerciseId: string, field: keyof RoutineExerciseItemDto, value: number) => {
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
      routineExerciseItems: routineExercises.map((item, index) => ({
        ...item,
        orderIndex: index, // Asegurar orden secuencial
      })),
      routinePrivate: isPrivate ?? false,
    };

    onSave(payload, initialData?.id);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-brand-background/80" onPress={onClose} />

        <View className="bg-brand-surface rounded-t-3xl px-6 pt-3 pb-10 max-h-[90%] min-h-[80%]">
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 rounded-full bg-brand-muted" />
          </View>

          <Text className="text-brand-primary text-2xl font-bold mb-4">
            {initialData ? 'Edit Routine' : 'Create Routine'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {/* Nombre de la rutina */}
            <Text className="text-content-secondary text-xs font-semibold mb-1 uppercase tracking-wider">Routine Name</Text>
            <TextInput
              placeholder="e.g. Upper Body Hypertrophy"
              placeholderTextColor={Colors.content.muted}
              value={name}
              onChangeText={setName}
              className="bg-brand-background text-brand-primary text-base px-4 py-3.5 rounded-xl border border-brand-surfaceBorder mb-4"
            />

            {/* Privacidad */}
            <View className="flex-row items-center justify-between bg-brand-background p-4 rounded-xl border border-brand-surfaceBorder mb-6">
              <View>
                <Text className="text-brand-primary font-semibold text-base">Private Routine</Text>
                <Text className="text-content-tertiary text-xs">Only you will be able to see and use this routine</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: Colors.brand.surfaceBorder, true: Colors.status.info }}
                thumbColor={Colors.brand.primary}
              />
            </View>

            {/* Lista de Ejercicios Estructurados */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-brand-primary text-lg font-bold">Exercises ({routineExercises.length})</Text>
              <TouchableOpacity
                onPress={() => setIsSelectorVisible(true)}
                className="bg-brand-surfaceAlt px-3 py-1.5 rounded-lg flex-row items-center"
              >
                <Ionicons name="add" size={16} color={Colors.brand.primary} className="mr-1" />
                <Text className="text-brand-primary text-xs font-semibold">Add Exercises</Text>
              </TouchableOpacity>
            </View>

            {routineExercises.length === 0 ? (
              <View className="bg-brand-background border border-dashed border-brand-surfaceBorder rounded-xl p-6 items-center justify-center mb-4">
                <Text className="text-content-tertiary text-sm">No exercises added yet.</Text>
              </View>
            ) : (
              routineExercises.map((item, index) => {
                const details = exerciseDetailsMap[item.exerciseId] || { name: 'Exercise', muscleGroup: '' };
                return (
                  <View key={item.exerciseId} className="bg-brand-background border border-brand-surfaceBorder rounded-xl p-4 mb-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-brand-primary font-bold text-base" numberOfLines={1}>
                          {index + 1}. {details.name}
                        </Text>
                        <Text className="text-content-tertiary text-xs">{details.muscleGroup}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveExercise(item.exerciseId)}>
                        <Ionicons name="trash-outline" size={18} color={Colors.status.dangerLight} />
                      </TouchableOpacity>
                    </View>

                    {/* Inputs para Sets, Reps y Descanso */}
                    <View className="flex-row gap-2 mt-2 pt-2 border-t border-brand-surface">
                      <View className="flex-1">
                        <Text className="text-content-muted text-[10px] uppercase font-bold mb-1">Sets</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.targetSets)}
                          onChangeText={(val) => handleUpdateItemMeta(item.exerciseId, 'targetSets', parseInt(val) || 0)}
                          className="bg-brand-surface text-brand-primary text-center py-1.5 rounded-lg border border-brand-surfaceBorder text-sm font-semibold"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-content-muted text-[10px] uppercase font-bold mb-1">Reps</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.targetReps)}
                          onChangeText={(val) => handleUpdateItemMeta(item.exerciseId, 'targetReps', parseInt(val) || 0)}
                          className="bg-brand-surface text-brand-primary text-center py-1.5 rounded-lg border border-brand-surfaceBorder text-sm font-semibold"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-content-muted text-[10px] uppercase font-bold mb-1">Rest (s)</Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(item.restTimeSeconds)}
                          onChangeText={(val) => handleUpdateItemMeta(item.exerciseId, 'restTimeSeconds', parseInt(val) || 0)}
                          className="bg-brand-surface text-brand-primary text-center py-1.5 rounded-lg border border-brand-surfaceBorder text-sm font-semibold"
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
            className="bg-brand-primary rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.brand.background} size="small" />
            ) : (
              <Text className="text-brand-background text-base font-semibold">
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