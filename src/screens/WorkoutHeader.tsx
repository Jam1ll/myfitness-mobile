import { Colors } from '@/theme/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
    workoutName: string;
    elapsedTime: string;
    exerciseCount: number;
    onDiscard: () => void;
    onAddExercise: () => void;
}

export default function WorkoutHeader({ workoutName, elapsedTime, exerciseCount, onDiscard, onAddExercise }: Props) {
    return (
        <View className="px-5 pt-4 pb-5 border-b border-brand-surfaceBorder">
            <View className="flex-row items-center justify-between mb-4">
                {/* Botón Discard Agrandado */}
                <TouchableOpacity activeOpacity={0.7} onPress={onDiscard} className="flex-row items-center py-2.5 px-4 rounded-xl bg-status-danger/10 border border-status-danger/20">
                    <Ionicons name="trash-outline" size={18} color={Colors.status.danger} />
                    <Text className="text-status-danger text-sm font-bold ml-2">Discard</Text>
                </TouchableOpacity>

                {/* Cronómetro Global Agrandado */}
                <View className="flex-row items-center bg-brand-surfaceAlt px-4 py-2 rounded-full border border-brand-surfaceBorder">
                    <Ionicons name="time-outline" size={18} color={Colors.status.infoLight} />
                    <Text className="text-brand-primary text-sm font-bold ml-2 font-mono">{elapsedTime}</Text>
                </View>

                {/* Botón Add Agrandado */}
                <TouchableOpacity activeOpacity={0.7} onPress={onAddExercise} className="flex-row items-center py-2.5 px-4 rounded-xl bg-brand-surfaceAlt border border-brand-surfaceBorder">
                    <Ionicons name="add" size={20} color={Colors.brand.primary} />
                    <Text className="text-brand-primary text-sm font-bold ml-1">Add</Text>
                </TouchableOpacity>
            </View>

            {/* Títulos más legibles */}
            <Text className="text-brand-primary text-3xl font-black" numberOfLines={1}>
                {workoutName || 'Workout Session'}
            </Text>
            <Text className="text-content-secondary text-sm mt-1.5 font-medium">
                {exerciseCount} exercises • Tap an exercise to enter Focus Mode
            </Text>
        </View>
    );
}