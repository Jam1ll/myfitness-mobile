import { Redirect } from 'expo-router';

export default function Index() {
  // Más adelante, aquí leeremos el SecureStore.
  // Si el usuario tiene un JWT válido -> <Redirect href="/(tabs)" />
  // Como aún no tenemos login real, lo forzamos a ir a la pantalla de Auth:
  
  return <Redirect href="/login" />;
}