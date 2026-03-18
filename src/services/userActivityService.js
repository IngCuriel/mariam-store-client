/**
 * Servicio de actividad del usuario para personalizar la experiencia (tipo e-commerce).
 * Persiste en localStorage: productos vistos recientemente y búsquedas recientes (para recomendaciones).
 */

const STORAGE_KEYS = {
  RECENTLY_VIEWED: 'mariam_recently_viewed',
  RECENT_SEARCHES: 'mariam_recent_searches',
  RECENTLY_VIEWED_CATEGORIES: 'mariam_recently_viewed_categories',
};

const MAX_RECENTLY_VIEWED = 12;
const MAX_RECENT_SEARCHES = 10;
const MAX_RECENTLY_VIEWED_CATEGORIES = 8;

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Quitar los más viejos y reintentar
      const half = value.slice(0, Math.ceil(value.length / 2));
      try {
        localStorage.setItem(key, JSON.stringify(half));
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Snapshot mínimo de un producto para "Visto recientemente".
 * @typedef {{ id: number, name: string, price?: number, imageUrl?: string, categoryName?: string }} RecentProduct
 */

/**
 * Añade un producto a la lista de vistos recientemente (el más reciente primero, sin duplicados por id).
 * @param {RecentProduct | { id: number, name?: string, price?: number, images?: Array<{ url: string }>, category?: { name: string } }} product
 */
export function addRecentlyViewed(product) {
  if (!product?.id) return;
  const imageUrl =
    product.images?.[0]?.url ||
    (typeof product.imageUrl === 'string' ? product.imageUrl : null);
  const entry = {
    id: Number(product.id),
    name: product.name ?? 'Producto',
    price: product.price,
    imageUrl: imageUrl ?? undefined,
    categoryName: product.category?.name ?? undefined,
  };

  const list = safeParse(STORAGE_KEYS.RECENTLY_VIEWED, []);
  const filtered = list.filter((p) => p.id !== entry.id);
  const next = [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
  safeSet(STORAGE_KEYS.RECENTLY_VIEWED, next);
}

/**
 * @returns {RecentProduct[]}
 */
export function getRecentlyViewed() {
  return safeParse(STORAGE_KEYS.RECENTLY_VIEWED, []);
}

/**
 * Guarda un término de búsqueda para recomendaciones "Basado en tus búsquedas".
 * @param {string} term
 */
export function addRecentSearch(term) {
  const normalized = typeof term === 'string' ? term.trim() : '';
  if (!normalized) return;

  const list = safeParse(STORAGE_KEYS.RECENT_SEARCHES, []);
  const filtered = list.filter((t) => t !== normalized);
  const next = [normalized, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  safeSet(STORAGE_KEYS.RECENT_SEARCHES, next);
}

/**
 * @returns {string[]} Últimas búsquedas (más reciente primero)
 */
export function getRecentSearches() {
  return safeParse(STORAGE_KEYS.RECENT_SEARCHES, []);
}

/**
 * Snapshot mínimo de una categoría para "Categorías vistas recientemente".
 * @typedef {{ id: number, name: string, image?: string }} RecentCategory
 */

/**
 * Añade una categoría a la lista de vistas recientemente (el más reciente primero, sin duplicados por id).
 * @param {RecentCategory | { id: number, name?: string, image?: string }} category
 */
export function addRecentlyViewedCategory(category) {
  if (category?.id == null || category?.id === '') return;
  const entry = {
    id: category.id,
    name: category.name ?? 'Categoría',
    image: category.image ?? undefined,
  };

  const list = safeParse(STORAGE_KEYS.RECENTLY_VIEWED_CATEGORIES, []);
  const filtered = list.filter((c) => c.id !== entry.id);
  const next = [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED_CATEGORIES);
  safeSet(STORAGE_KEYS.RECENTLY_VIEWED_CATEGORIES, next);
}

/**
 * @returns {RecentCategory[]}
 */
export function getRecentlyViewedCategories() {
  return safeParse(STORAGE_KEYS.RECENTLY_VIEWED_CATEGORIES, []);
}
