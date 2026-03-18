import api from '../config/api';

const SESSION_KEY = 'mariam_analytics_session_id';

/**
 * Obtiene o genera un ID de sesión para agrupar eventos en la misma visita.
 * @returns {string}
 */
function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

/**
 * Tipos de eventos de analytics soportados.
 * El backend puede usar estos para agregar (más buscados, más vistos).
 */
export const AnalyticsEventType = {
  SEARCH: 'search',
  VIEW_ITEM: 'view_item',
};

/**
 * Envía un evento de analytics al backend para persistencia y reportes.
 * Si el backend no expone POST /api/analytics/events, se ignora el error.
 *
 * Contrato esperado del backend:
 * POST /api/analytics/events
 * Body: {
 *   type: 'search' | 'view_item',
 *   payload: { ... },
 *   timestamp: string (ISO),
 *   sessionId: string
 * }
 *
 * @param {string} type - AnalyticsEventType
 * @param {Object} payload - Datos del evento
 */
export async function sendAnalyticsEvent(type, payload) {
  const sessionId = getSessionId();
  const event = {
    type,
    payload: {
      ...payload,
      timestamp: new Date().toISOString(),
    },
    sessionId,
  };

  try {
    await api.post('/analytics/events', event);
  } catch (err) {
    // Backend puede no tener el endpoint aún; no romper la app
    if (err.response?.status !== 404 && err.response?.status !== 501) {
      console.warn('[Analytics] Error enviando evento al backend:', err.message);
    }
  }
}

/**
 * Registra una búsqueda de productos (para "más buscados" y análisis).
 * @param {Object} params
 * @param {string} params.query - Término de búsqueda
 * @param {number} params.resultsCount - Cantidad de resultados
 * @param {string|null} [params.categoryId] - ID de categoría si aplica
 * @param {string|null} [params.branch] - Sucursal si aplica
 */
export function trackSearch({ query, resultsCount, categoryId = null, branch = null }) {
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';
  if (!normalizedQuery) return;

  sendAnalyticsEvent(AnalyticsEventType.SEARCH, {
    search_term: normalizedQuery,
    results_count: resultsCount,
    category_id: categoryId ?? undefined,
    branch: branch ?? undefined,
  });
}

/**
 * Registra la vista de un producto (para "más vistos" y análisis).
 * @param {Object} product - Producto visto (con id, name, etc.)
 */
export function trackProductView(product) {
  if (!product?.id) return;

  sendAnalyticsEvent(AnalyticsEventType.VIEW_ITEM, {
    product_id: product.id,
    product_name: product.name ?? undefined,
    category_id: product.categoryId ?? product.category?.id ?? undefined,
    category_name: product.category?.name ?? undefined,
    price: product.price ?? undefined,
  });
}
