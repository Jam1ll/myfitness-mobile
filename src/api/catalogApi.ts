import { axiosClient } from './axiosClient';
import type {
  CreateExercisePayload,
  ExerciseResponse,
  UpdateExercisePayload,
} from '@/features/catalog/types';
import type { PageResponse } from '@/features/workouts/types';

export interface GetExercisesParams {
  page?: number;
  size?: number;
  mineOnly?: boolean;
  search?: string;
}

export const getExercises = async (
  params?: GetExercisesParams,
): Promise<PageResponse<ExerciseResponse>> => {
  const response = await axiosClient.get<PageResponse<ExerciseResponse>>('/exercises', {
    params,
  });
  return response.data;
};

export const getExerciseById = async (id: string): Promise<ExerciseResponse> => {
  const response = await axiosClient.get<ExerciseResponse>(`/exercises/${id}`);
  return response.data;
};

export const createExercise = async (
  payload: CreateExercisePayload,
): Promise<ExerciseResponse> => {
  const response = await axiosClient.post<ExerciseResponse>('/exercises', payload);
  return response.data;
};

export const updateExercise = async (
  id: string,
  payload: UpdateExercisePayload,
): Promise<ExerciseResponse> => {
  const response = await axiosClient.put<ExerciseResponse>(`/exercises/${id}`, payload);
  return response.data;
};

export const deleteExercise = async (id: string): Promise<void> => {
  await axiosClient.delete(`/exercises/${id}`);
};

export const catalogApi = {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};

export default catalogApi;

