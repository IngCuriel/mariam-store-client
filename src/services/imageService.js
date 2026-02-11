/**
 * Servicio para obtener imágenes de productos desde APIs gratuitas
 * cuando el producto no tiene imagen propia
 */

// Cache de imágenes para evitar múltiples peticiones
const imageCache = new Map();

/**
 * Obtiene una imagen de producto desde APIs gratuitas
 * Prioridad: Pexels (con API key) > Placeholder confiable
 */
export const getProductImageFromAPI = async (productName) => {
  // Verificar cache primero
  if (imageCache.has(productName)) {
    return imageCache.get(productName);
  }

  try {
    // Opción 1: Pexels API (requiere API key pero es gratuito y confiable)
    // Puedes obtener una API key en: https://www.pexels.com/api/
    const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || '';
    
    if (PEXELS_API_KEY) {
      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(productName)}&per_page=1`,
          {
            headers: {
              Authorization: PEXELS_API_KEY,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const imageUrl = data.photos[0].src.medium;
            imageCache.set(productName, imageUrl);
            return imageUrl;
          }
        }
      } catch (pexelsError) {
        console.warn('Pexels API no disponible, usando placeholder:', pexelsError);
      }
    }

    // Si no hay API key o falla, usar placeholder confiable directamente
    // No usar Unsplash Source porque está dando 503
    return getPlaceholderImage(productName);
  } catch (error) {
    console.error('Error obteniendo imagen desde API:', error);
    // Retornar placeholder como último recurso
    return getPlaceholderImage(productName);
  }
};

/**
 * Genera un placeholder SVG local (100% confiable, no depende de servicios externos)
 */
export const getPlaceholderImage = (productName) => {
  // Limpiar el nombre del producto para el placeholder
  const cleanName = (productName || 'Producto')
    .substring(0, 25)
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
    .trim() || 'Producto';
  
  // Crear un SVG como data URI (no requiere servicios externos)
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#DC143C"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        font-weight="bold" 
        fill="#FFFFFF" 
        text-anchor="middle" 
        dominant-baseline="middle"
        style="word-wrap: break-word;"
      >
        ${cleanName.split(' ').slice(0, 3).join(' ')}
      </text>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  
  // Convertir SVG a data URI
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * Obtiene la mejor imagen disponible para un producto
 * Prioridad: 1. Imagen del producto, 2. API externa, 3. Placeholder
 * NOTA: Ya NO usa imagen de categoría como fallback
 */
export const getBestProductImage = async (product, useAPI = false) => {
  // 1. Si tiene imágenes propias, usarlas
  if (product.images && product.images.length > 0) {
    return product.images[0].url;
  }

  // 2. Si se permite usar API externa, intentar obtener imagen directamente
  if (useAPI && product.name) {
    try {
      return await getProductImageFromAPI(product.name);
    } catch (error) {
      console.error('Error obteniendo imagen desde API:', error);
    }
  }

  // 3. Usar placeholder como último recurso
  return getPlaceholderImage(product.name || 'Producto');
};

/**
 * Obtiene emoji o icono del producto
 */
export const getProductEmoji = (product) => {
  if (product.icon) return product.icon;
  if (product.category?.icon) return product.category.icon;
  return '📦';
};

