import { axiosClient } from '@/api/axiosClient';
import AppText from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';

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

export default function ExerciseSelectorModal({
  isVisible,
  onClose,
  onConfirm,
  initialSelectedIds = [],
}: ExerciseSelectorProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isVisible) {
      if (!hasInitialized.current) {
        setSelectedIds(initialSelectedIds);
        hasInitialized.current = true;
      }
      fetchExercises();
    } else {
      hasInitialized.current = false;
    }
  }, [isVisible]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/exercises?page=0&size=50');
      setExercises(response.data.content || []);
    } catch {
      Alert.alert(t('common.error'), t('modals.loadCatalogError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((eId) => eId !== id) : [...prev, id],
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          style={{ backgroundColor: colors.brand.background + 'B3' }}
          className="absolute inset-0"
          onPress={onClose}
        />

        <View
          style={{ backgroundColor: colors.brand.surface }}
          className="rounded-t-3xl px-6 pt-3 pb-10 min-h-[70%] max-h-[90%]"
        >
          <View className="items-center mb-6">
            <View
              style={{ backgroundColor: colors.brand.muted }}
              className="w-12 h-1.5 rounded-full"
            />
          </View>

          <AppText
            weight="bold"
            style={{ color: colors.brand.primary }}
            className="text-2xl font-bold mb-6"
          >
            {t('modals.selectExercises')}
          </AppText>

          {loading ? (
            <ActivityIndicator color={colors.brand.primary} size="large" className="mt-10" />
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
                    style={{
                      backgroundColor: isSelected
                        ? colors.brand.surfaceAlt
                        : colors.brand.background,
                      borderColor: isSelected
                        ? colors.brand.primary
                        : colors.brand.surfaceBorder,
                    }}
                    className="flex-row items-center justify-between p-4 mb-3 rounded-xl border"
                  >
                    <View>
                      <AppText
                        weight="bold"
                        style={{ color: colors.brand.primary }}
                        className="font-semibold text-base"
                      >
                        {item.name}
                      </AppText>
                      <AppText
                        style={{ color: colors.content.tertiary }}
                        className="text-xs"
                      >
                        {item.muscleGroup}
                      </AppText>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.brand.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onConfirm(selectedIds);
              onClose();
            }}
            style={{ backgroundColor: colors.brand.primary }}
            className="rounded-xl py-4 flex-row items-center justify-center mt-4"
          >
            <AppText
              weight="bold"
              style={{ color: colors.brand.background }}
              className="text-base font-semibold"
            >
              {t('modals.confirmCount', { count: selectedIds.length })}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
