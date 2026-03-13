import api from '../config/api';

// Obtener todos los productos con filtros opcionales y paginación
// config: opcional, ej. { signal } para cancelar la petición
export const getAllProducts = async (params = {}, config = {}) => {
  const queryParams = { ...params };
  if (params.showInStoreOnly) {
    queryParams.showInStoreOnly = 'true';
  }
  if (params.includePresentations) {
    queryParams.includePresentations = 'true';
  }
  if (params.includeInventory) {
    queryParams.includeInventory = 'true';
  }
  const response = await api.get('/products/all', { params: queryParams, ...config });
  return response.data;
};

// Obtener todas las categorías
export const getAllCategories = async (params = {}) => {
  const queryParams = {};
  if (params.showInStore) {
    queryParams.showInStore = 'true';
  }
  const response = await api.get('/products/categories/all', { params: queryParams });
  return response.data;
};

// Obtener todas las sucursales únicas
export const getAllBranches = async () => {
  const response = await api.get('/products/branches');
  return response.data;
};

// Obtener un producto por ID
export const getProductById = async (id, includePresentations = false, includeInventory = false) => {
  const params = {};
  if (includePresentations) params.includePresentations = 'true';
  if (includeInventory) params.includeInventory = 'true';
  
  const response = await api.get(`/products/${id}`, { params });
  return response.data;
};

