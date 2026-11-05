import { Colors } from '@/theme/colors';
import { SessionExercise } from '@/types/session';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, TouchableOpacity, View } from 'react-native';

interface Props {
    item: SessionExercise;
    isActive: boolean;
    exerciseIndex: number;
    drag: () => void;
    onOpenModal: (index: number) => void;
    onRemove: (index: number, name: string) => void;
}

export default function ExerciseOverviewCard({ item, isActive, exerciseIndex, drag, onOpenModal, onRemove }: Props) {
    const totalSets = item.sets.length;
    const completedSets = item.sets.filter((s) => s.completed).length;
    const allCompleted = totalSets > 0 && completedSets === totalSets;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenModal(exerciseIndex)}
            className={`bg-brand-surface rounded-2xl p-5 mb-4 border ${isActive ? 'border-status-info shadow-xl' : allCompleted ? 'border-status-info/30 bg-brand-surfaceAlt/30' : 'border-brand-surfaceBorder'}`}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-3">
                    {/* Botón Drag Agrandado */}
                    <TouchableOpacity onLongPress={drag} activeOpacity={0.6} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} className="w-12 h-12 rounded-xl bg-brand-surfaceAlt items-center justify-center mr-4 border border-brand-surfaceBorder">
                        <Ionicons name="reorder-two-outline" size={24} color={Colors.content.secondary} />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-brand-primary text-lg font-bold" numberOfLines={1}>{item.name}</Text>
                        <View className="flex-row items-center mt-1.5">
                            {allCompleted ? (
                                <>
                                    <Ionicons name="checkmark-circle" size={16} color={Colors.status.infoLight} />
                                    <Text className="text-status-infoLight text-sm font-semibold ml-1.5">All {totalSets} Sets Completed</Text>
                                </>
                            ) : completedSets > 0 ? (
                                <>
                                    <Ionicons name="pie-chart-outline" size={16} color={Colors.brand.primary} />
                                    <Text className="text-content-secondary text-sm font-medium ml-1.5">{completedSets}/{totalSets} Sets Completed</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="play-circle-outline" size={16} color={Colors.content.muted} />
                                    <Text className="text-content-muted text-sm font-medium ml-1.5">Tap to start</Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>
                <View className="flex-row items-center">
                    {/* Botón Borrar Agrandado */}
                    <TouchableOpacity onPress={() => onRemove(exerciseIndex, item.name)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} className="p-3 mr-1">
                        <Ionicons name="trash-outline" size={20} color={Colors.status.danger} />
                    </TouchableOpacity>
                    {/* Chevron Agrandado */}
                    <View className="w-10 h-10 rounded-full bg-brand-surfaceAlt items-center justify-center border border-brand-surfaceBorder">
                        <Ionicons name="chevron-forward" size={20} color={Colors.content.secondary} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}