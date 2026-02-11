import api from '../config/api';

/**
 * Obtener todas las notificaciones del usuario
 * @param {Object} params - Parámetros de consulta (read, limit)
 * @returns {Promise<Array>} Array de notificaciones
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

/**
 * Obtener contador de notificaciones no leídas
 * @returns {Promise<Object>} { count: number }
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

/**
 * Marcar notificación como leída
 * @param {number} id - ID de la notificación
 * @returns {Promise<Object>} Notificación actualizada
 */
export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Marcar todas las notificaciones como leídas
 * @returns {Promise<Object>} { message: string, count: number }
 */
export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

/**
 * Eliminar notificación
 * @param {number} id - ID de la notificación
 * @returns {Promise<Object>} { message: string }
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

