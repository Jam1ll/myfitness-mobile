import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.5:8080/api/v1';

// Caché en memoria para acceso instantáneo
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
    // Si la memoria está vacía (ej. abriste la app recién), lo busca en el disco
    if (!memoryToken) {
      if (Platform.OS === 'web') {
        memoryToken = localStorage.getItem('jwt_token');
      } else {
        memoryToken = await SecureStore.getItemAsync('jwt_token');
      }
    }
    
    console.log(`[Axios] Petición a ${config.url} | Token:`, memoryToken ? `${memoryToken.substring(0, 15)}...` : 'NULO');
    
    if (memoryToken && config.headers) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
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