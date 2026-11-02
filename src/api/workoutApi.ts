import { axiosClient } from './axiosClient';
import type {
  CreateRoutinePayload,
  CreateWeeklyProgramRequest,
  PageResponse,
  RoutineDetailResponse,
  RoutineSummary,
  UpdateWeeklyProgramRequest,
  WeeklyProgramResponse,
} from '@/features/workouts/types';

export interface GetRoutinesParams {
  page?: number;
  size?: number;
  mineOnly?: boolean;
  search?: string;
}

// ─── Rutinas ──────────────────────────────────────────────────────────────────

export const getRoutines = async (
  params?: GetRoutinesParams,
): Promise<PageResponse<RoutineSummary>> => {
  const response = await axiosClient.get<PageResponse<RoutineSummary>>('/workouts/routines', {
    params,
  });
  return response.data;
};

export const getRoutineById = async (id: string): Promise<RoutineDetailResponse> => {
  const response = await axiosClient.get<RoutineDetailResponse>(`/workouts/routines/${id}`);
  return response.data;
};

export const createRoutine = async (
  payload: CreateRoutinePayload,
): Promise<RoutineDetailResponse> => {
  const response = await axiosClient.post<RoutineDetailResponse>('/workouts/routines', payload);
  return response.data;
};

export const updateRoutine = async (
  id: string,
  payload: CreateRoutinePayload,
): Promise<RoutineDetailResponse> => {
  const response = await axiosClient.put<RoutineDetailResponse>(
    `/workouts/routines/${id}`,
    payload,
  );
  return response.data;
};

export const deleteRoutine = async (id: string): Promise<void> => {
  await axiosClient.delete(`/workouts/routines/${id}`);
};

// ─── Programas Semanales ──────────────────────────────────────────────────────

export const getPrograms = async (): Promise<WeeklyProgramResponse[]> => {
  const response = await axiosClient.get<
    PageResponse<WeeklyProgramResponse> | WeeklyProgramResponse[]
  >('/workouts/programs');
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  }
  return data.content ?? [];
};

export const getActiveProgram = async (): Promise<WeeklyProgramResponse> => {
  const response = await axiosClient.get<WeeklyProgramResponse>('/workouts/programs/active');
  return response.data;
};

export const createProgram = async (
  payload: CreateWeeklyProgramRequest,
): Promise<WeeklyProgramResponse> => {
  const response = await axiosClient.post<WeeklyProgramResponse>('/workouts/programs', payload);
  return response.data;
};

export const updateProgram = async (
  id: string,
  payload: UpdateWeeklyProgramRequest,
): Promise<WeeklyProgramResponse> => {
  const response = await axiosClient.put<WeeklyProgramResponse>(
    `/workouts/programs/${id}`,
    payload,
  );
  return response.data;
};

export const deleteProgram = async (id: string): Promise<void> => {
  await axiosClient.delete(`/workouts/programs/${id}`);
};

// Export consolidated object as well for workoutApi.<method> usage
export const workoutApi = {
  getRoutines,
  getRoutineById,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getPrograms,
  getActiveProgram,
  createProgram,
  updateProgram,
  deleteProgram,
};

export default workoutApi;

