import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ExerciseResponse } from './ExerciseDetailsModal';

const MUSCLE_GROUPS = ['CHEST', 'BACK', 'ARMS', 'LEGS', 'CORE', 'SHOULDERS'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface CreateExercisePayload {
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  exercisePrivate: boolean;
}

interface CreateExerciseProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (payload: CreateExercisePayload, id?: string) => void;
  isSaving: boolean;
  initialData?: ExerciseResponse | null;
}

export default function CreateExerciseModal({ isVisible, onClose, onSave, isSaving, initialData }: CreateExerciseProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('CHEST');
  const [exercisePrivate, setExercisePrivate] = useState(true);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description);
        setMuscleGroup(initialData.muscleGroup as MuscleGroup);
        setExercisePrivate(initialData.exercisePrivate);
      } else {
        setName('');
        setDescription('');
        setMuscleGroup('CHEST');
        setExercisePrivate(true);
      }
    }
  }, [isVisible, initialData]);

  const handleSave = () => {
    if (!name || name.trim().length < 3) {
      Alert.alert('Validation Error', 'Exercise name must have at least 3 characters.');
      return;
    }
    if (!description || description.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must have at least 10 characters.');
      return;
    }
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      muscleGroup,
      exercisePrivate
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
            {isEditing ? 'Edit exercise' : 'Create exercise'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Exercise name..."
            placeholderTextColor="#6b7280"
            className="bg-black text-white border border-zinc-800 rounded-xl px-4 py-3 mb-4"
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-black text-white border border-zinc-800 rounded-xl px-4 py-3 mb-4 h-28"
          />

          <Text className="text-gray-400 text-sm font-medium mb-3">Muscle group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <View className="flex-row">
              {MUSCLE_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group}
                  activeOpacity={0.8}
                  onPress={() => setMuscleGroup(group)}
                  className={`rounded-full px-4 py-2 mr-2 ${muscleGroup === group ? 'bg-white' : 'bg-zinc-800'}`}
                >
                  <Text className={`text-sm font-medium ${muscleGroup === group ? 'text-black' : 'text-gray-400'}`}>
                    {group}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className="flex-row items-center justify-between mb-8">
            <Text className="text-gray-400 flex-1 mr-4">Private exercise (Only you can see it)</Text>
            <Switch
              value={exercisePrivate}
              onValueChange={setExercisePrivate}
              trackColor={{ false: '#3f3f46', true: '#ffffff' }}
              thumbColor={exercisePrivate ? '#000000' : '#a1a1aa'}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
            className="bg-white rounded-xl py-4 flex-row items-center justify-center"
          >
            {isSaving ? <ActivityIndicator color="#000000" /> : <Text className="text-black text-base font-semibold">{isEditing ? 'Update Exercise' : 'Save Exercise'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}