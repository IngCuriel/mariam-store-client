import api from '../config/api';

// Crear solicitud de efectivo express
export const createCashExpressRequest = async (data) => {
  const response = await api.post('/cash-express', data);
  return response.data;
};

// Obtener solicitudes del usuario
export const getCashExpressRequests = async (status) => {
  const params = {};
  if (status) params.status = status;
  params.page = 1;
  params.limit = 200;
  const response = await api.get('/cash-express', { params });
  return response.data;
};

// Obtener una solicitud por ID
export const getCashExpressRequestById = async (id) => {
  const response = await api.get(`/cash-express/${id}`);
  return response.data;
};

// Subir comprobante de depósito
export const uploadDepositReceipt = async (id, depositReceiptUrl) => {
  const response = await api.patch(`/cash-express/${id}/receipt`, { depositReceipt: depositReceiptUrl });
  return response.data.request;
};

// Confirmar/Enviar comprobante
export const confirmDepositReceipt = async (id) => {
  const response = await api.post(`/cash-express/${id}/receipt/confirm`);
  return response.data.request;
};

// Subir comprobante firmado
export const uploadSignedReceipt = async (id, signedReceiptUrl) => {
  const response = await api.patch(`/cash-express/${id}/signed-receipt`, { signedReceipt: signedReceiptUrl });
  return response.data.request;
};

// Actualizar datos del remitente y destinatario
export const updateRecipientData = async (id, data) => {
  const response = await api.patch(`/cash-express/${id}/recipient-data`, data);
  return response.data.request;
};

// Obtener configuración de Efectivo Express
export const getCashExpressConfig = async () => {
  const response = await api.get('/cash-express/config/get');
  return response.data;
};

// Obtener fecha de disponibilidad sugerida
export const getSuggestedAvailability = async (amount) => {
  const response = await api.get('/cash-express/availability/suggested', {
    params: { amount },
  });
  return response.data;
};

// Obtener cuentas bancarias activas
export const getBankAccounts = async () => {
  const response = await api.get('/cash-express/bank-accounts');
  return response.data;
};

