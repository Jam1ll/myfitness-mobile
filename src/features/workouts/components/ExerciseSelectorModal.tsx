import { axiosClient } from '@/api/axiosClient';
import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

type ExerciseItem = {
  id: string;
  name: string;
  muscleGroup: string;
};

interface ExerciseSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  initialSelectedIds?: string[];
}

export default function ExerciseSelectorModal({ isVisible, onClose, onConfirm, initialSelectedIds = [] }: ExerciseSelectorProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  useEffect(() => {
    if (isVisible) {
      setSelectedIds(initialSelectedIds);
      fetchExercises();
    }
  }, [isVisible, initialSelectedIds]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/exercises?page=0&size=50');
      setExercises(response.data.content || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load exercises catalog.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-brand-background/80" onPress={onClose} />
        
        <View className="bg-brand-surface rounded-t-3xl px-6 pt-3 pb-10 min-h-[70%] max-h-[90%]">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 rounded-full bg-brand-muted" />
          </View>

          <Text className="text-brand-primary text-2xl font-bold mb-6">Select Exercises</Text>

          {loading ? (
            <ActivityIndicator color={Colors.brand.primary} size="large" className="mt-10" />
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleExercise(item.id)}
                    className={`flex-row items-center justify-between p-4 mb-3 rounded-xl border ${isSelected ? 'bg-brand-surfaceAlt border-brand-primary' : 'bg-brand-background border-brand-surfaceBorder'}`}
                  >
                    <View>
                      <Text className="text-brand-primary font-semibold text-base">{item.name}</Text>
                      <Text className="text-content-tertiary text-xs">{item.muscleGroup}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={Colors.brand.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { onConfirm(selectedIds); onClose(); }}
            className="bg-brand-primary rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            <Text className="text-brand-background text-base font-semibold">Confirm ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}