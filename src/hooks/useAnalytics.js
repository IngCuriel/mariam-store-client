import { useEffect } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase';

/**
 * Hook personalizado para usar Firebase Analytics
 * @returns {Object} Funciones para registrar eventos
 */
export function useAnalytics() {
  /**
   * Registra un evento en Firebase Analytics
   * @param {string} eventName - Nombre del evento
   * @param {Object} eventParams - Parámetros adicionales del evento (opcional)
   */
  const logAnalyticsEvent = (eventName, eventParams = {}) => {
    if (analytics) {
      try {
        logEvent(analytics, eventName, eventParams);
      } catch (error) {
        console.error('Error logging analytics event:', error);
      }
    }
  };

  /**
   * Registra cuando un usuario inicia sesión
   * @param {string} method - Método de login (email, google, etc.)
   */
  const logLogin = (method = 'email') => {
    logAnalyticsEvent('login', { method });
  };

  /**
   * Registra cuando un usuario se registra
   * @param {string} method - Método de registro (email, google, etc.)
   */
  const logSignUp = (method = 'email') => {
    logAnalyticsEvent('sign_up', { method });
  };

  /**
   * Registra cuando un usuario visita una página
   * @param {string} pageName - Nombre de la página
   * @param {string} pagePath - Ruta de la página
   */
  const logPageView = (pageName, pagePath) => {
    logAnalyticsEvent('page_view', {
      page_title: pageName,
      page_location: pagePath,
    });
  };

  /**
   * Registra cuando se crea una solicitud de Cash Express
   * @param {number} amount - Monto de la solicitud
   */
  const logCashExpressRequest = (amount) => {
    logAnalyticsEvent('cash_express_request_created', {
      amount,
      currency: 'MXN',
    });
  };

  /**
   * Registra cuando se sube un comprobante de depósito
   * @param {string} requestId - ID de la solicitud
   */
  const logDepositReceiptUpload = (requestId) => {
    logAnalyticsEvent('deposit_receipt_uploaded', {
      request_id: requestId,
    });
  };

  /**
   * Registra cuando se completa una solicitud de Cash Express
   * @param {string} requestId - ID de la solicitud
   * @param {string} status - Estado final de la solicitud
   */
  const logCashExpressCompleted = (requestId, status) => {
    logAnalyticsEvent('cash_express_completed', {
      request_id: requestId,
      status,
    });
  };

  return {
    logAnalyticsEvent,
    logLogin,
    logSignUp,
    logPageView,
    logCashExpressRequest,
    logDepositReceiptUpload,
    logCashExpressCompleted,
  };
}

