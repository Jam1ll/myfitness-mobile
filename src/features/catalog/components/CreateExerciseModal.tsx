import { ExerciseResponse } from './ExerciseDetailsModal';
import AppText from '@/components/common/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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

export default function CreateExerciseModal({
  isVisible,
  onClose,
  onSave,
  isSaving,
  initialData,
}: CreateExerciseProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('CHEST');
  const [exercisePrivate, setExercisePrivate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description);
        setMuscleGroup(initialData.muscleGroup as MuscleGroup);
        setExercisePrivate(Boolean(initialData.exercisePrivate));
      } else {
        setName('');
        setDescription('');
        setMuscleGroup('CHEST');
        setExercisePrivate(false);
      }
    }
  }, [isVisible, initialData]);

  const handleSave = () => {
    if (!name || name.trim().length < 3) {
      Alert.alert(t('common.error'), t('exercises.validationName'));
      return;
    }
    if (!description || description.trim().length < 10) {
      Alert.alert(t('common.error'), t('exercises.validationDescription'));
      return;
    }

    onSave(
      {
        name: name.trim(),
        description: description.trim(),
        muscleGroup,
        exercisePrivate: Boolean(exercisePrivate),
      },
      initialData?.id,
    );
  };

  const isEditing = Boolean(initialData);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          style={{ backgroundColor: colors.brand.background + 'B3' }}
          className="absolute inset-0"
          onPress={onClose}
        />

        <View
          style={{ backgroundColor: colors.brand.surface }}
          className="rounded-t-3xl px-6 pt-3 pb-10"
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
            {isEditing ? t('exercises.editExercise') : t('exercises.createExercise')}
          </AppText>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('exercises.exerciseNamePlaceholder')}
            placeholderTextColor={colors.content.tertiary}
            style={{
              backgroundColor: colors.brand.background,
              color: colors.brand.primary,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="border rounded-xl px-4 py-3 mb-4 text-base"
          />

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('exercises.descriptionPlaceholder')}
            placeholderTextColor={colors.content.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.brand.background,
              color: colors.brand.primary,
              borderColor: colors.brand.surfaceBorder,
            }}
            className="border rounded-xl px-4 py-3 mb-4 h-28 text-base"
          />

          <AppText
            weight="semibold"
            style={{ color: colors.content.secondary }}
            className="text-sm font-medium mb-3"
          >
            {t('exercises.muscleGroupLabel')}
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <View className="flex-row">
              {MUSCLE_GROUPS.map((group) => {
                const isSelected = muscleGroup === group;
                return (
                  <TouchableOpacity
                    key={group}
                    activeOpacity={0.8}
                    onPress={() => setMuscleGroup(group)}
                    style={{
                      backgroundColor: isSelected
                        ? colors.brand.primary
                        : colors.brand.surfaceAlt,
                    }}
                    className="rounded-full px-4 py-2 mr-2"
                  >
                    <AppText
                      weight={isSelected ? 'bold' : 'regular'}
                      style={{
                        color: isSelected
                          ? colors.brand.background
                          : colors.content.secondary,
                      }}
                      className="text-sm font-medium"
                    >
                      {t(`exercises.muscleGroups.${group.toLowerCase()}`, {
                        defaultValue: group,
                      })}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View className="flex-row items-center justify-between mb-8">
            <AppText
              style={{ color: colors.content.secondary }}
              className="flex-1 mr-4 text-sm"
            >
              {t('exercises.privateExerciseLabel')}
            </AppText>
            <Switch
              value={exercisePrivate}
              onValueChange={setExercisePrivate}
              trackColor={{ false: colors.brand.borderMuted, true: colors.brand.primary }}
              thumbColor={exercisePrivate ? colors.brand.background : colors.content.secondary}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isSaving}
            style={{ backgroundColor: colors.brand.primary }}
            className="rounded-xl py-4 flex-row items-center justify-center"
          >
            {isSaving ? (
              <ActivityIndicator color={colors.brand.background} />
            ) : (
              <AppText
                weight="bold"
                style={{ color: colors.brand.background }}
                className="text-base font-semibold"
              >
                {isEditing ? t('exercises.updateExercise') : t('exercises.saveExercise')}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
