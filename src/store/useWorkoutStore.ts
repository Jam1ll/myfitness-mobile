import { axiosClient } from '@/api/axiosClient';
import type {
  ActiveSession,
  ExerciseSet,
  OfflineQueueItem,
  SessionExercise
} from '@/types/session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

// ─── Resilient Storage Adapter (Expo Go & Production Safe) ───────────────────

const inMemoryStorage: Record<string, string> = {};

let nativeStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-async-storage/async-storage');
  nativeStorage = mod?.default || mod;
} catch {
  nativeStorage = null;
}

export const safeWorkoutStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(name);
        }
      } catch {
        return inMemoryStorage[name] ?? null;
      }
    }

    if (nativeStorage && typeof nativeStorage.getItem === 'function') {
      try {
        const val = await nativeStorage.getItem(name);
        if (val !== null && val !== undefined) return val;
      } catch {
        // Fall through to SecureStore
      }
    }

    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return inMemoryStorage[name] ?? null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    inMemoryStorage[name] = value;

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(name, value);
        }
      } catch {
        // Ignored
      }
      return;
    }

    if (nativeStorage && typeof nativeStorage.setItem === 'function') {
      try {
        await nativeStorage.setItem(name, value);
        return;
      } catch {
        // Fall through to SecureStore
      }
    }

    try {
      if (value.length < 2000) {
        await SecureStore.setItemAsync(name, value);
      }
    } catch {
      // Memory fallback preserved
    }
  },

  removeItem: async (name: string): Promise<void> => {
    delete inMemoryStorage[name];

    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(name);
        }
      } catch {
        // Ignored
      }
      return;
    }

    if (nativeStorage && typeof nativeStorage.removeItem === 'function') {
      try {
        await nativeStorage.removeItem(name);
        return;
      } catch {
        // Fall through to SecureStore
      }
    }

    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Ignored
    }
  },
};

export interface WorkoutState {
  // State
  activeSession: ActiveSession | null;
  isResting: boolean;
  restTimeRemaining: number;
  offlineQueue: OfflineQueueItem[];

  // Actions
  startSession: (
    routineId: string | null,
    name: string,
    exercises: Array<{ exerciseId: string; name: string }>,
  ) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    updatedFields: Partial<ExerciseSet>,
  ) => void;
  addSetToExercise: (exerciseIndex: number) => void;
  removeSetFromExercise: (exerciseIndex: number, setIndex: number) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  addExerciseToSession: (exercise: { exerciseId: string; name: string }) => void;
  removeExerciseFromSession: (exerciseIndex: number) => void;
  cancelSession: () => void;
  completeSession: () => Promise<boolean>;
  syncOfflineQueue: () => Promise<void>;
  setIsResting: (isResting: boolean) => void;

  // FIX: Updated signature to accept an updater function or a direct number
  setRestTimeRemaining: (valOrUpdater: number | ((prev: number) => number)) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      // Estado Inicial
      activeSession: null,
      isResting: false,
      restTimeRemaining: 0,
      offlineQueue: [],

      // Acciones
      startSession: (routineId, name, exercises) => {
        const initialExercises: SessionExercise[] = exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          orderIndex: index,
          notes: null,
          sets: [
            {
              setNumber: 1,
              reps: null,
              weight: null,
              rpe: null,
              completed: false,
            },
          ],
        }));

        set({
          activeSession: {
            routineId,
            name,
            startTime: new Date().toISOString(),
            notes: null,
            exercises: initialExercises,
          },
          isResting: false,
          restTimeRemaining: 0,
        });
      },

      updateSet: (exerciseIndex, setIndex, updatedFields) => {
        set((state) => {
          if (!state.activeSession) return state;

          const currentExercises = state.activeSession.exercises;
          if (!currentExercises[exerciseIndex]) return state;

          const currentSets = currentExercises[exerciseIndex].sets;
          if (!currentSets[setIndex]) return state;

          const updatedExercises = currentExercises.map((exercise, eIdx) => {
            if (eIdx !== exerciseIndex) return exercise;

            const updatedSets = exercise.sets.map((setObj, sIdx) => {
              if (sIdx !== setIndex) return setObj;
              return { ...setObj, ...updatedFields };
            });

            return { ...exercise, sets: updatedSets };
          });

          return {
            activeSession: {
              ...state.activeSession,
              exercises: updatedExercises,
            },
          };
        });
      },

      addSetToExercise: (exerciseIndex) => {
        set((state) => {
          if (!state.activeSession) return state;

          const currentExercises = state.activeSession.exercises;
          if (!currentExercises[exerciseIndex]) return state;

          const updatedExercises = currentExercises.map((exercise, eIdx) => {
            if (eIdx !== exerciseIndex) return exercise;

            const lastSet = exercise.sets[exercise.sets.length - 1];
            const nextSetNumber = lastSet ? lastSet.setNumber + 1 : 1;

            const newSet: ExerciseSet = {
              setNumber: nextSetNumber,
              reps: null,
              weight: null,
              rpe: null,
              completed: false,
            };

            return {
              ...exercise,
              sets: [...exercise.sets, newSet],
            };
          });

          return {
            activeSession: {
              ...state.activeSession,
              exercises: updatedExercises,
            },
          };
        });
      },

      removeSetFromExercise: (exerciseIndex, setIndex) => {
        set((state) => {
          if (!state.activeSession) return state;

          const currentExercises = state.activeSession.exercises;
          if (!currentExercises[exerciseIndex]) return state;

          const updatedExercises = currentExercises.map((exercise, eIdx) => {
            if (eIdx !== exerciseIndex) return exercise;

            const filteredSets = exercise.sets
              .filter((_, sIdx) => sIdx !== setIndex)
              .map((setObj, idx) => ({
                ...setObj,
                setNumber: idx + 1,
              }));

            return {
              ...exercise,
              sets: filteredSets,
            };
          });

          return {
            activeSession: {
              ...state.activeSession,
              exercises: updatedExercises,
            },
          };
        });
      },

      reorderExercises: (fromIndex, toIndex) => {
        set((state) => {
          if (!state.activeSession) return state;

          const exercises = [...state.activeSession.exercises];
          if (
            fromIndex < 0 ||
            fromIndex >= exercises.length ||
            toIndex < 0 ||
            toIndex >= exercises.length
          ) {
            return state;
          }

          const [movedExercise] = exercises.splice(fromIndex, 1);
          exercises.splice(toIndex, 0, movedExercise);

          const reorderedExercises = exercises.map((ex, index) => ({
            ...ex,
            orderIndex: index,
          }));

          return {
            activeSession: {
              ...state.activeSession,
              exercises: reorderedExercises,
            },
          };
        });
      },

      addExerciseToSession: (exercise) => {
        set((state) => {
          if (!state.activeSession) return state;

          const newEx: SessionExercise = {
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            orderIndex: state.activeSession.exercises.length,
            notes: null,
            sets: [
              {
                setNumber: 1,
                reps: null,
                weight: null,
                rpe: null,
                completed: false,
              },
            ],
          };

          return {
            activeSession: {
              ...state.activeSession,
              exercises: [...state.activeSession.exercises, newEx],
            },
          };
        });
      },

      removeExerciseFromSession: (exerciseIndex) => {
        set((state) => {
          if (!state.activeSession) return state;

          const filtered = state.activeSession.exercises
            .filter((_, idx) => idx !== exerciseIndex)
            .map((ex, idx) => ({ ...ex, orderIndex: idx }));

          return {
            activeSession: {
              ...state.activeSession,
              exercises: filtered,
            },
          };
        });
      },

      cancelSession: () => {
        set({
          activeSession: null,
          isResting: false,
          restTimeRemaining: 0,
        });
      },

      completeSession: async (): Promise<boolean> => {
        const session = get().activeSession;
        if (!session) return false;

        const rawPayload = JSON.parse(
          JSON.stringify({
            routineId: session.routineId,
            name: session.name,
            startTime: session.startTime,
            endTime: new Date().toISOString(),
            notes: session.notes ?? null,
            exercises: session.exercises,
          })
        );

        const sanitizedExercises = rawPayload.exercises
          .map((ex: any) => {
            const validSets = ex.sets
              .filter((s: any) => s.completed && (Number(s.reps) > 0 || Number(s.weight) > 0))
              .map((s: any, sIdx: number) => ({
                setNumber: sIdx + 1,
                reps: Number(s.reps) || 0,
                weight: s.weight !== null && s.weight !== undefined ? Number(s.weight) : 0,
                rpe: s.rpe !== null && s.rpe !== undefined ? Number(s.rpe) : 8,
                completed: true,
              }));

            return {
              exerciseId: ex.exerciseId,
              name: ex.name,
              notes: ex.notes ?? null,
              sets: validSets,
            };
          })
          .filter((ex: any) => ex.sets.length > 0)
          .map((ex: any, exIdx: number) => ({
            ...ex,
            orderIndex: exIdx,
          }));

        const totalValidSets = sanitizedExercises.reduce((acc: number, ex: any) => acc + ex.sets.length, 0);

        if (totalValidSets === 0) {
          Alert.alert(
            'No Activity Detected',
            'There is no activity in this session. Please add at least one valid set to complete the session.'
          );
          return false;
        }

        const payload = {
          ...rawPayload,
          exercises: sanitizedExercises,
        };

        const idempotencyKey = Crypto.randomUUID();

        try {
          await axiosClient.post('/sessions', payload, {
            headers: {
              'Idempotency-Key': idempotencyKey,
            },
          });

          set({
            activeSession: null,
            isResting: false,
            restTimeRemaining: 0,
          });

          Alert.alert('¡Excelente!', 'Sesión guardada exitosamente.');
          return true; // <--- RETORNA TRUE. Éxito total en el servidor.
        } catch (error: any) {
          console.error(
            '[WorkoutStore] Error detallado del servidor:',
            JSON.stringify(error?.response?.data, null, 2)
          );

          const offlineItem: OfflineQueueItem = {
            idempotencyKey,
            payload,
            timestamp: Date.now(),
          };

          set((state) => ({
            activeSession: null,
            isResting: false,
            restTimeRemaining: 0,
            offlineQueue: [...state.offlineQueue, offlineItem],
          }));

          Alert.alert('Modo Offline', 'No se pudo conectar con el servidor. La sesión se guardó localmente y se sincronizará luego.');
          return true;
        }
      },

      syncOfflineQueue: async () => {
        const queue = get().offlineQueue;
        if (!queue || queue.length === 0) return;

        const remainingQueue: OfflineQueueItem[] = [];

        for (const item of queue) {
          try {
            await axiosClient.post('/sessions', item.payload, {
              headers: {
                'Idempotency-Key': item.idempotencyKey,
              },
            });
            console.log(
              `[WorkoutStore] Sesión offline sincronizada con éxito (${item.idempotencyKey})`,
            );
          } catch (error) {
            console.error(
              `[WorkoutStore] Error al sincronizar sesión offline (${item.idempotencyKey}):`,
              error,
            );
            remainingQueue.push(item);
          }
        }

        set({ offlineQueue: remainingQueue });
      },

      setIsResting: (isResting) => set({ isResting }),

      // FIX: Implementation handles both direct value and updater function
      setRestTimeRemaining: (valOrUpdater) =>
        set((state) => ({
          restTimeRemaining:
            typeof valOrUpdater === 'function'
              ? valOrUpdater(state.restTimeRemaining)
              : valOrUpdater,
        })),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => safeWorkoutStorage),
      // Guardar únicamente el estado activo y la cola offline
      partialize: (state) => ({
        activeSession: state.activeSession,
        offlineQueue: state.offlineQueue,
      }),
    },
  ),
);

export default useWorkoutStore;