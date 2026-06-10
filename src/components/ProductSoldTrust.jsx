import React from 'react';
import './ProductSoldTrust.css';

/**
 * Prueba social en tarjetas de producto (total vendidos).
 * Prioriza datos reales del API cuando existan; opción demo estable por id solo para maquetación.
 * Backend: exponer p.ej. totalSold en el listado y poner SHOW_DEMO_SOLD_COUNT=false.
 */
export const SHOW_DEMO_SOLD_COUNT = true;
const DEMO_SOLD_MIN = 1;
const DEMO_SOLD_MAX = 500;

export function getSoldCountForCard(entity) {
  if (!entity || typeof entity !== 'object') return null;
  const raw =
    entity.totalSold ??
    entity.totalUnitsSold ??
    entity.unitsSold ??
    entity.salesCount;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return Math.round(raw);
  }
  if (SHOW_DEMO_SOLD_COUNT && entity.id != null) {
    const n = Number(entity.id);
    if (!Number.isFinite(n)) return null;
    const span = DEMO_SOLD_MAX - DEMO_SOLD_MIN + 1;
    return DEMO_SOLD_MIN + ((n * 2654435761) >>> 0) % span;
  }
  return null;
}

export function formatCompactSoldCount(n) {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(n);
}

/**
 * @param {{ product: Record<string, unknown> }} props
 */
export function ProductSoldTrust({ product }) {
  const sold = getSoldCountForCard(product);
  if (sold == null) return null;
  const label = `${sold.toLocaleString('es-MX')} ventas acumuladas`;
  const countPart = formatCompactSoldCount(sold);
  return (
    <span className="product-card-sold-trust" title={label} aria-label={label}>
      <span className="product-card-sold-trust-sep" aria-hidden />
      <span className="product-card-sold-trust-text">
        +{countPart} vendidos
      </span>
    </span>
  );
}
