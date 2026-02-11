import axios from 'axios';

const API_URL = 'https://mariam-pos-web-api.onrender.com';
// const API_URL = 'http://localhost:4000'; // Para desarrollo local

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper para obtener token desde localStorage
const getToken = () => {
  return localStorage.getItem('auth_token');
};

const removeToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const token = getToken();
      
      // Solo redirigir si había un token (significa que expiró o es inválido)
      // Si no hay token, es normal para endpoints públicos
      if (token) {
        // Token inválido o expirado, limpiar autenticación
        removeToken();
        // Redirigir al login solo si no estamos en páginas públicas
        const publicPaths = ['/login', '/register', '/', '/products', '/cash-express'];
        const currentPath = window.location.pathname;
        if (!publicPaths.some(path => currentPath.startsWith(path))) {
          window.location.href = '/login';
        }
      }
      // Si no hay token, simplemente rechazar el error sin redirigir
      // Esto permite que endpoints públicos funcionen sin autenticación
    }
    return Promise.reject(error);
  }
);

export default api;

