import api from '../config/api';

/** Tipos de entrega activos (recoger en sucursal, envío a domicilio, etc.) */
export const getDeliveryTypes = async () => {
  const response = await api.get('/orders/delivery-types');
  return response.data;
};

export const createOrder = async (data) => {
  const response = await api.post('/orders', data);
  return response.data;
};

/**
 * Obtiene pedidos con paginación.
 * @param {string} [status] - Filtro por estado
 * @param {number} [page=1] - Página
 * @param {number} [limit=10] - Pedidos por página
 * @returns {Promise<{ orders: Array, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }>}
 */
export const getOrders = async (status, page = 1, limit = 10) => {
  const params = { page, limit };
  if (status) params.status = status;
  const response = await api.get('/orders', { params });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

/** Cliente acepta pedido actualizado -> pasa a IN_PREPARATION. Para envío a domicilio enviar deliveryAddress. */
export const confirmOrderByCustomer = async (id, data = {}) => {
  const response = await api.post(`/orders/${id}/confirm-by-customer`, data);
  return response.data;
};

/**
 * Cliente o admin cancela el pedido.
 * @param {string|number} id - Order id
 * @param {{ reason?: string }} [data] - Motivo de cancelación (opcional)
 */
export const cancelOrder = async (id, data = {}) => {
  const response = await api.post(`/orders/${id}/cancel`, data);
  return response.data;
};

