// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration.
// measurementId es la misma propiedad de Google Analytics 4 (GA4); los eventos
// que envíes con logEvent() aparecen en la consola de GA4.
const firebaseConfig = {
  apiKey: 'AIzaSyBLF_ytkSGAf_OaCEjfr2Dh90LFjUolq50',
  authDomain: 'minisupercurieldigital.firebaseapp.com',
  projectId: 'minisupercurieldigital',
  storageBucket: 'minisupercurieldigital.firebasestorage.app',
  messagingSenderId: '879081281800',
  appId: '1:879081281800:web:1ea65a08f17ab66eef74bd',
  measurementId: 'G-3NKXHSWK3T', // ID de propiedad GA4
};

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

