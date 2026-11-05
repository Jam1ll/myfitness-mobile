import axios from 'axios';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.5:8080/api/v1';

let memoryToken: string | null = null;

export const setAuthToken = async (token: string | null) => {
  memoryToken = token;
  if (token) {
    if (Platform.OS === 'web') {
      localStorage.setItem('jwt_token', token);
    } else {
      await SecureStore.setItemAsync('jwt_token', token);
    }
  } else {
    if (Platform.OS === 'web') {
      localStorage.removeItem('jwt_token');
    } else {
      await SecureStore.deleteItemAsync('jwt_token');
    }
  }
};

export const axiosClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    if (!memoryToken) {
      if (Platform.OS === 'web') {
        memoryToken = localStorage.getItem('jwt_token');
      } else {
        memoryToken = await SecureStore.getItemAsync('jwt_token');
      }
    }

    console.log(`[Axios] Petición a ${config.url} | Token:`, memoryToken ? `${memoryToken.substring(0, 15)}...` : 'NULO');

    if (!config.headers) {
      config.headers = {} as any;
    }

    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }

    if (config.method?.toUpperCase() === 'POST') {
      const existingHeaders = config.headers;
      const hasIdempotencyKey =
        (typeof existingHeaders.has === 'function' &&
          (existingHeaders.has('Idempotency-Key') || existingHeaders.has('idempotency-key'))) ||
        (typeof existingHeaders.get === 'function' &&
          Boolean(existingHeaders.get('Idempotency-Key') || existingHeaders.get('idempotency-key'))) ||
        Object.keys(existingHeaders).some(
          (key) => key.toLowerCase() === 'idempotency-key'
        );

      if (!hasIdempotencyKey) {
        const idempotencyKey = Crypto.randomUUID();
        if (typeof existingHeaders.set === 'function') {
          existingHeaders.set('Idempotency-Key', idempotencyKey);
        } else {
          existingHeaders['Idempotency-Key'] = idempotencyKey;
        }
      }
    }

    if (__DEV__) {
      console.log(`-------------------------------------------`);
      console.log(`[Axios Outgoing] ${config.method} -> ${config.url}`);
      console.log(`[Headers]`, JSON.stringify(config.headers, null, 2));
      console.log(`[Payload Data]`, JSON.stringify(config.data, null, 2));
      console.log(`-------------------------------------------`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("[Axios] Error 401 detectado, borrando credenciales...");
      await setAuthToken(null);
    }
    return Promise.reject(error);
  }
);
