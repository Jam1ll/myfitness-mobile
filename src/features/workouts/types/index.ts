// ─── Rutinas (Plantillas) ───────────────────────────────────────────────────

export interface EnrichedRoutineExercise {
  exerciseId: string;
  name: string;
  description: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: number;
  restTimeSeconds: number;
  orderIndex: number;
}

export interface RoutineSummary {
  id: string;
  name: string;
  routinePrivate: boolean;
  createdBy: string;
  createdAt: string;
}

export interface RoutineDetailResponse {
  id: string;
  name: string;
  routinePrivate: boolean;
  createdBy: string;
  createdAt: string;
  routineOwner: boolean;
  enrichedRoutineExercises: EnrichedRoutineExercise[];
}

export interface RoutineExerciseItemDto {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restTimeSeconds: number;
  orderIndex: number;
}

export interface CreateRoutinePayload {
  name: string;
  routinePrivate: boolean;
  routineExerciseItems: RoutineExerciseItemDto[];
}

// ─── Programas Semanales (Weekly Programs) ──────────────────────────────────

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ProgramDayItemDto {
  routineId: string;
  dayOfWeek: DayOfWeek;
}

export interface ProgramDayResponse {
  id: string;
  dayOfWeek: DayOfWeek;
  routineId: string;
  routineName?: string;
}

export interface WeeklyProgramResponse {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  programOwner: boolean;
  programDays: ProgramDayResponse[];
  weeklyProgramActive: boolean;
}

export interface CreateWeeklyProgramRequest {
  name: string;
  programDays: ProgramDayItemDto[];
  weeklyProgramActive: boolean;
}

export interface UpdateWeeklyProgramRequest {
  name: string;
  programDays: ProgramDayItemDto[];
  weeklyProgramActive: boolean;
}

// ─── Paginación Genérica ───────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
