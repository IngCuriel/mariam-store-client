import api from '../config/api';

// Crear pedido
export const createOrder = async (data) => {
  const response = await api.post('/orders', data);
  return response.data;
};

// Obtener pedidos del usuario
export const getOrders = async (status) => {
  const params = {};
  if (status) params.status = status;
  const response = await api.get('/orders', { params });
  return response.data;
};

// Obtener un pedido por ID
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

