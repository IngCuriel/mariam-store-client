import api from '../config/api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/auth/register', { 
    name, 
    email, 
    password,
    registrationSource: 'WEB' // Identificar que el registro viene de la web
  });
  return response.data;
};

export const verifyToken = async (token) => {
  const response = await api.get('/auth/verify', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

