import { logEvent } from 'firebase/analytics';
import { analytics } from '../config/firebase';
import {
  trackSearch as trackSearchBackend,
  trackProductView as trackProductViewBackend,
} from '../services/analyticsService';

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

  /**
   * Registra una búsqueda de productos (Firebase + backend para reportes).
   * @param {Object} params
   * @param {string} params.searchTerm - Término buscado
   * @param {number} [params.resultsCount] - Cantidad de resultados
   * @param {string|null} [params.categoryId] - ID categoría si aplica
   * @param {string|null} [params.branch] - Sucursal si aplica
   */
  const logSearch = ({ searchTerm, resultsCount = 0, categoryId = null, branch = null }) => {
    const term = typeof searchTerm === 'string' ? searchTerm.trim() : '';
    if (!term) return;

    logAnalyticsEvent('search', {
      search_term: term,
      results_count: resultsCount,
      ...(categoryId && { category_id: categoryId }),
      ...(branch && { branch }),
    });
    trackSearchBackend({
      query: term,
      resultsCount,
      categoryId,
      branch,
    });
  };

  /**
   * Registra la vista de un producto (Firebase + backend para "más vistos").
   * @param {Object} product - Objeto producto con id, name, category, price
   */
  const logViewItem = (product) => {
    if (!product?.id) return;

    logAnalyticsEvent('view_item', {
      currency: 'MXN',
      value: product.price,
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          ...(product.category?.name && { item_category: product.category.name }),
        },
      ],
    });
    trackProductViewBackend(product);
  };

  return {
    logAnalyticsEvent,
    logLogin,
    logSignUp,
    logPageView,
    logCashExpressRequest,
    logDepositReceiptUpload,
    logCashExpressCompleted,
    logSearch,
    logViewItem,
  };
}

