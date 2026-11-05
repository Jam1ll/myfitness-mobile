import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const inMemoryStorage: Record<string, string> = {};

let nativeStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-async-storage/async-storage');
  nativeStorage = mod?.default || mod;
} catch {
  nativeStorage = null;
}

export const safeStorage: StateStorage = {
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

export const safeWorkoutStorage = safeStorage;

