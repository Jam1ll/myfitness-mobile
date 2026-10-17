import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ExerciseSelectorModal from './ExerciseSelectorModal';
import { WorkoutDetailResponse } from './RoutineDetailsModal';

export interface CreateRoutinePayload {
  name: string;
  workoutPrivate: boolean;
  exerciseIds: string[];
}

interface CreateRoutineProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (payload: CreateRoutinePayload, id?: string) => void;
  isSaving: boolean;
  initialData?: WorkoutDetailResponse | null;
}

export default function CreateRoutineModal({ isVisible, onClose, onSave, isSaving, initialData }: CreateRoutineProps) {
  const [name, setName] = useState('');
  const [workoutPrivate, setWorkoutPrivate] = useState(true);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setName(initialData.name);
        setWorkoutPrivate(initialData.workoutPrivate);
        // Extraemos solo los IDs de los ejercicios que ya tiene la rutina
        setSelectedExerciseIds(initialData.exercises ? initialData.exercises.map(ex => ex.id) : []);
      } else {
        setName('');
        setWorkoutPrivate(true);
        setSelectedExerciseIds([]);
      }
    }
  }, [isVisible, initialData]);

  const handleSave = () => {
    if (!name || name.trim().length < 3) {
      Alert.alert('Validation Error', 'Routine name must have at least 3 characters.');
      return;
    }
    
    onSave({ 
      name: name.trim(), 
      workoutPrivate, 
      exerciseIds: selectedExerciseIds 
    }, initialData?.id);
  };

  const handleClose = () => {
    onClose();
  };

  const isEditing = !!initialData;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/70" onPress={handleClose} />

        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-3 pb-10">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 rounded-full bg-zinc-600" />
          </View>

          <Text className="text-white text-2xl font-bold mb-6">
            {isEditing ? 'Edit Routine' : 'Create Routine'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Routine name (e.g., Push Day)..."
            placeholderTextColor="#6b7280"
            className="bg-black text-white border border-zinc-800 rounded-xl px-4 py-3 mb-6"
          />

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-gray-400 flex-1 mr-4">Private routine</Text>
            <Switch
              value={workoutPrivate}
              onValueChange={setWorkoutPrivate}
              trackColor={{ false: '#3f3f46', true: '#ffffff' }}
              thumbColor={workoutPrivate ? '#000000' : '#a1a1aa'}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsSelectorVisible(true)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 mb-8 flex-row justify-between items-center"
          >
            <Text className="text-white font-semibold">
              {selectedExerciseIds.length > 0 ? `${selectedExerciseIds.length} Exercises Selected` : 'Add Exercises'}
            </Text>
            <Text className="text-gray-400 text-xs">Tap to modify</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
            className="bg-white rounded-xl py-4 flex-row items-center justify-center"
          >
            {isSaving ? <ActivityIndicator color="#000000" /> : <Text className="text-black text-base font-semibold">{isEditing ? 'Update Routine' : 'Save Routine'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ExerciseSelectorModal 
        isVisible={isSelectorVisible} 
        onClose={() => setIsSelectorVisible(false)} 
        initialSelectedIds={selectedExerciseIds}
        onConfirm={setSelectedExerciseIds} 
      />
    </Modal>
  );
}