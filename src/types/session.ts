export interface ExerciseSet {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  completed: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  orderIndex: number;
  notes: string | null;
  sets: ExerciseSet[];
}

export interface ActiveSession {
  routineId: string | null;
  name: string;
  startTime: string;
  notes: string | null;
  exercises: SessionExercise[];
}

export interface SessionPayload {
  routineId: string | null;
  name: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  exercises: SessionExercise[];
}

export interface OfflineQueueItem {
  idempotencyKey: string;
  payload: SessionPayload | any;
  timestamp: number;
}

