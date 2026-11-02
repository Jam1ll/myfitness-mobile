export const MUSCLE_GROUPS = ['CHEST', 'BACK', 'ARMS', 'LEGS', 'CORE', 'SHOULDERS'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export interface ExerciseResponse {
  id: string;
  name: string;
  description: string;
  muscleGroup: string;
  exercisePrivate: boolean;
  exerciseOwner: boolean;
}

export interface CreateExercisePayload {
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  exercisePrivate: boolean;
}

export interface UpdateExercisePayload {
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  exercisePrivate: boolean;
}

