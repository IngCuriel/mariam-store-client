/**
 * Fechas de negocio alineadas con la API (America/Mexico_City por defecto).
 */

export const BUSINESS_TZ = 'America/Mexico_City';

/** Hoy como YYYY-MM-DD en la zona de negocio. */
export function getBusinessTodayYYYYMMDD() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: BUSINESS_TZ });
}
