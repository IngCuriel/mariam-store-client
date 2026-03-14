import api from '../config/api';

/** Lista las direcciones guardadas del usuario */
export const getMyAddresses = async () => {
  const response = await api.get('/addresses');
  return response.data;
};

/** Crea una dirección */
export const createAddress = async (data) => {
  const response = await api.post('/addresses', data);
  return response.data;
};

/** Actualiza una dirección */
export const updateAddress = async (id, data) => {
  const response = await api.patch(`/addresses/${id}`, data);
  return response.data;
};

/** Elimina una dirección */
export const deleteAddress = async (id) => {
  await api.delete(`/addresses/${id}`);
};

/** Marca una dirección como predeterminada */
export const setDefaultAddress = async (id) => {
  const response = await api.post(`/addresses/${id}/set-default`);
  return response.data;
};
