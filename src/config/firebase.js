// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// La configuración se define por ambiente en .env.dev / .env.prod
// (se selecciona con `vite --mode dev|prod`).
// measurementId es la misma propiedad de Google Analytics 4 (GA4); los eventos
// que envíes con logEvent() aparecen en la consola de GA4.
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID, // ID de propiedad GA4
};

// Falla de forma explícita si se hizo build sin un modo válido (dev|prod)
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  throw new Error(
    'Falta la configuración de Firebase. Usa `--mode dev` o `--mode prod` (ver .env.dev / .env.prod).'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only if supported, e.g., not in SSR environments)
let analytics = null;

// Check if Analytics is supported before initializing
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, analytics };
