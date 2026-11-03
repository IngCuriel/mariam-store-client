import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { getProductById } from '../services/productsService';
import './OrderSuggestions.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price ?? 0);

/** Same promo rule as ProductDetail (promoPrice < price and not expired). */
const isPromoActive = (p) =>
  p?.isPromo === true &&
  p?.promoPrice != null &&
  p.promoPrice < (p?.price || 0) &&
  (p?.promoEndsAt == null || new Date(p.promoEndsAt) > new Date());

/**
 * A product needs the detail page to be added when it has presentations or
 * tiered pricing (same conditions ProductDetail uses).
 */
const needsOptions = (product) =>
  (Array.isArray(product?.presentations) && product.presentations.length > 0) ||
  (product?.pricingMode === 'tiered' && Array.isArray(product?.priceTiers) && product.priceTiers.length > 0);

/**
 * Alternatives suggested by the store for an unavailable order item.
 * Adding one goes to the cart (it becomes a NEW order, the current one is not modified).
 */
export default function OrderSuggestions({ productName, suggestions, onNotify }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(() => new Set());

  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;

  const handleAdd = async (suggestion) => {
    if (suggestion.hasOptions) {
      navigate(`/products/${suggestion.id}`);
      return;
    }
    setAddingId(suggestion.id);
    try {
      // Full product (same shape ProductDetail adds to the cart).
      const product = await getProductById(suggestion.id, true, true);
      if (needsOptions(product)) {
        navigate(`/products/${suggestion.id}`);
        return;
      }
      const overrideUnitPrice = isPromoActive(product) ? product.promoPrice : null;
      addToCart(product, null, 1, overrideUnitPrice);
      setAddedIds((prev) => new Set(prev).add(suggestion.id));
      onNotify?.(`"${product.name}" se agregó a tu carrito.`, 'success');
    } catch {
      onNotify?.('No pudimos agregar el producto. Intenta de nuevo.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section className="order-sugg" aria-label={`Alternativas para ${productName}`}>
      <div className="order-sugg-head">
        <span className="order-sugg-icon" aria-hidden="true">
          ✨
        </span>
        <div>
          <p className="order-sugg-title">Te puede interesar</p>
          <p className="order-sugg-sub">Alternativas que te recomendamos en lugar de este producto</p>
        </div>
      </div>

      <ul className="order-sugg-list">
        {suggestions.map((s) => {
          const promo = isPromoActive(s);
          const price = promo ? s.promoPrice : s.price;
          const added = addedIds.has(s.id);
          return (
            <li key={s.id} className="order-sugg-card">
              <Link to={`/products/${s.id}`} className="order-sugg-image" aria-label={`Ver ${s.name}`}>
                {s.imageUrl ? <img src={s.imageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">🛒</span>}
                {promo && <span className="order-sugg-badge">Oferta</span>}
              </Link>
              <div className="order-sugg-body">
                <Link to={`/products/${s.id}`} className="order-sugg-name" title={s.name}>
                  {s.name}
                </Link>
                <p className="order-sugg-price">
                  {formatPrice(price)}
                  {s.unitAbbreviation && <span className="order-sugg-unit"> / {s.unitAbbreviation}</span>}
                  {promo && <span className="order-sugg-old">{formatPrice(s.price)}</span>}
                </p>
                <button
                  type="button"
                  className={`order-sugg-btn${added ? ' is-added' : ''}`}
                  onClick={() => handleAdd(s)}
                  disabled={addingId === s.id}
                >
                  {addingId === s.id
                    ? 'Agregando…'
                    : s.hasOptions
                      ? 'Elegir opción'
                      : added
                        ? '✓ Agregar otro'
                        : 'Agregar al carrito'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="order-sugg-note">Se agregan a tu carrito como un pedido nuevo.</p>
    </section>
  );
}
