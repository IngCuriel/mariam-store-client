import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

/**
 * Componente que rastrea automáticamente las vistas de página
 * Úsalo envolviendo tus rutas o agregándolo en App.jsx
 */
export default function AnalyticsPageView() {
  const location = useLocation();
  const { logPageView } = useAnalytics();

  useEffect(() => {
    // Obtener el nombre de la página desde la ruta
    const pageName = getPageNameFromPath(location.pathname);
    
    // Registrar la vista de página
    logPageView(pageName, location.pathname);
  }, [location, logPageView]);

  return null; // Este componente no renderiza nada
}

/**
 * Obtiene un nombre legible de la página desde la ruta
 * @param {string} pathname - Ruta actual
 * @returns {string} Nombre de la página
 */
function getPageNameFromPath(pathname) {
  const routeMap = {
    '/': 'Tienda Online',
    '/products': 'Tienda Online',
    '/cash-express': 'Efectivo Express',
    '/cash-express/requests': 'Mis Solicitudes',
    '/cash-express/requests/:id': 'Detalle de Solicitud',
    '/cash-express/terms': 'Términos y Condiciones',
    '/login': 'Iniciar Sesión',
    '/register': 'Registro',
    '/forgot-password': 'Recuperar Contraseña',
    '/reset-password': 'Restablecer Contraseña',
    '/cart': 'Carrito',
    '/home': 'Inicio',
  };

  // Buscar coincidencia exacta primero
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // Buscar coincidencia con parámetros (ej: /cash-express/requests/123)
  for (const [route, name] of Object.entries(routeMap)) {
    if (route.includes(':id') && pathname.startsWith(route.split(':id')[0])) {
      return name;
    }
  }

  // Si no hay coincidencia, usar la ruta como nombre
  return pathname.charAt(1).toUpperCase() + pathname.slice(2) || 'Inicio';
}

