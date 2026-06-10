/**
 * Feature flags de la tienda en línea.
 *
 * Efectivo Express (menú, rutas, footer, notificaciones):
 *   .env → VITE_ENABLE_CASH_EXPRESS=true
 * Por defecto desactivado si no está definido.
 */
export const CASH_EXPRESS_ENABLED =
  import.meta.env.VITE_ENABLE_CASH_EXPRESS === 'true';

export function isCashExpressPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false;
  return pathname === '/cash-express' || pathname.startsWith('/cash-express/');
}

/** Evita redirigir a rutas de EE cuando el módulo está apagado. */
export function sanitizeReturnPath(path) {
  if (!path || typeof path !== 'string') return '/';
  if (!CASH_EXPRESS_ENABLED && isCashExpressPath(path)) return '/';
  return path;
}
