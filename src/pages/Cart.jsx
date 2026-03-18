import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductEmoji } from '../services/imageService';
import { createOrder } from '../services/ordersService';
import { Toast } from '../components/Toast';
import './Cart.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const EFFECTIVE_AVAILABILITY = (product) =>
  product?.productAvailability ? String(product.productAvailability).trim() : 'local_delivery';

const CART_AVAILABILITY_SECTIONS = {
  local_delivery: { orderable: true },
  online_pickup: { orderable: true },
  in_store_only: { orderable: false },
};

/** Indica si el producto se puede incluir en un pedido en línea. */
const isOrderable = (product) =>
  CART_AVAILABILITY_SECTIONS[EFFECTIVE_AVAILABILITY(product)]?.orderable !== false;

/** Clave de sucursal para agrupar: nombre de sucursal o "General" si no tiene. */
const getBranchKey = (item) =>
  item?.product?.branch || item?.product?.branchInfo?.name || 'General';

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, removeItemsFromCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Aceptar',
    flowDescription: null,
    flowSteps: null,
  });
  /** Pantalla de éxito después de generar el pedido (estilo Mercado Libre). */
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const pendingConfirmRef = useRef(null);
  const confirmDialogRef = useRef(null);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (confirmDialog.open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [confirmDialog.open]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const openConfirm = useCallback((title, message, confirmLabel, onConfirm, flowDescription = null, flowSteps = null) => {
    pendingConfirmRef.current = onConfirm;
    setConfirmDialog({ open: true, title, message, confirmLabel, flowDescription, flowSteps });
  }, []);
  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    pendingConfirmRef.current = null;
  }, []);
  const handleConfirmAction = useCallback(() => {
    const fn = pendingConfirmRef.current;
    if (fn) fn();
    closeConfirm();
  }, [closeConfirm]);
  const handleCancelConfirm = useCallback(() => {
    closeConfirm();
  }, [closeConfirm]);

  /** Productos agrupados por sucursal (orden estable por nombre). */
  const itemsByBranch = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = getBranchKey(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([branchKey, branchItems]) => ({
        branchKey,
        branchName: branchKey,
        items: branchItems,
      }));
  }, [items]);

  /** Sucursales que tienen al menos un producto pedible en línea → un pedido por sucursal. */
  const orderableGroupsForCheckout = useMemo(() => {
    return itemsByBranch
      .filter((group) => group.items.some((item) => isOrderable(item.product)))
      .map((group) => {
        const firstProduct = group.items.find((item) => isOrderable(item.product))?.product;
        return {
          branchKey: group.branchKey,
          branchName: group.branchName,
          branchId: firstProduct?.branchId ?? null,
          orderableItems: group.items.filter((item) => isOrderable(item.product)),
        };
      });
  }, [itemsByBranch]);

  const orderableItems = useMemo(
    () => items.filter((item) => isOrderable(item.product)),
    [items]
  );
  const totalOrderable = orderableItems.reduce((sum, item) => sum + item.subtotal, 0);
  const numOrders = orderableGroupsForCheckout.length;
  const isMultiBranch = numOrders > 1;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openConfirm(
        'Iniciar sesión',
        'Inicia sesión para generar tu pedido.',
        'Ir a iniciar sesión',
        () => navigate('/login', { state: { from: '/cart' } })
      );
      return;
    }

    if (orderableItems.length === 0) {
      showToast('Agrega al menos un producto disponible en línea.', 'info');
      return;
    }

    const message =
      numOrders > 1
        ? `${numOrders} pedidos (uno por sucursal). Total: ${formatPrice(totalOrderable)}`
        : `Total: ${formatPrice(totalOrderable)}`;
    const flowSteps = [
      'Revisamos disponibilidad y te notificamos.',
      'Aceptas o cancelas el pedido según lo disponible.',
      'Eliges cómo recibirlo (recoger o envío).',
      'Te avisamos cuando esté listo.',
    ];
    openConfirm('Generar pedido', message, 'Generar pedido', () => submitOrder(), null, flowSteps);
  };

  const submitOrder = async () => {
    try {
      setCreatingOrder(true);

      for (const group of orderableGroupsForCheckout) {
        const { branchName, branchId: groupBranchId, orderableItems: groupItems } = group;
        if (groupItems.length === 0) continue;

        const orderItems = groupItems.map((item) => {
          const payload = {
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          };
          if (item.presentation) {
            payload.presentationName = item.presentation.name;
            payload.presentationQuantity = item.presentation.quantity;
          }
          return payload;
        });

        const firstAvailability = EFFECTIVE_AVAILABILITY(groupItems[0].product);
        const payload = {
          items: orderItems,
          notes: `Pedido web - ${branchName} (${groupItems.length} ${groupItems.length === 1 ? 'producto' : 'productos'})`,
          orderAvailability: firstAvailability,
        };
        if (groupBranchId != null) {
          payload.branchId = groupBranchId;
        }
        await createOrder(payload);
      }

      removeItemsFromCart(orderableItems.map((item) => item.id));
      setOrderSuccessOpen(true);
    } catch (error) {
      showToast(
        error.response?.data?.error || 'No se pudo generar el pedido. Intenta de nuevo.',
        'error'
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  /** Pantalla de éxito después de generar el pedido (estilo Mercado Libre). */
  if (orderSuccessOpen) {
    return (
      <div className="cart-page cart-page--success">
        <div className="cart-container">
          <section
            className="cart-order-success"
            aria-labelledby="cart-order-success-title"
            aria-live="polite"
          >
            <div className="cart-order-success-icon" aria-hidden>
              <span className="cart-order-success-check">✓</span>
            </div>
            <h1 id="cart-order-success-title" className="cart-order-success-title">
              Pedido creado
            </h1>
            <p className="cart-order-success-subtitle">
              Revisaremos disponibilidad y te notificamos. Luego confirma y elige cómo recibirlo.
            </p>
            <div className="cart-order-success-actions">
              <button
                type="button"
                className="cart-order-success-btn cart-order-success-btn--primary"
                onClick={() => {
                  setOrderSuccessOpen(false);
                  navigate('/orders');
                }}
              >
                Ver mis pedidos
              </button>
              <button
                type="button"
                className="cart-order-success-btn cart-order-success-btn--secondary"
                onClick={() => {
                  setOrderSuccessOpen(false);
                  navigate('/products');
                }}
              >
                Seguir explorando más productos
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <nav className="cart-breadcrumb">
            <Link to="/">Inicio</Link>
            <span>›</span>
            <Link to="/products">Productos</Link>
            <span>›</span>
            <span className="cart-breadcrumb-current">Carrito</span>
          </nav>
          <h1 className="cart-page-title">Carrito de compras</h1>
          <p className="cart-page-subtitle">Tu carrito está vacío</p>
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega productos desde la tienda para comenzar tu compra</p>
            <div className="cart-empty-actions">
              <Link to="/products" className="cart-btn-primary">
                Ver productos
              </Link>
              <Link to="/" className="cart-btn-secondary">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {creatingOrder && (
        <div className="cart-order-loading-overlay" role="status" aria-live="polite" aria-label="Generando pedido">
          <div className="cart-order-loading-card">
            <div className="cart-order-loading-spinner" aria-hidden />
            <p className="cart-order-loading-text">Generando pedido</p>
            <p className="cart-order-loading-subtext">Un momento, por favor...</p>
          </div>
        </div>
      )}
      <dialog
        ref={confirmDialogRef}
        className="cart-confirm-dialog"
        aria-labelledby="cart-confirm-title"
        onClose={handleCancelConfirm}
        onCancel={handleCancelConfirm}
      >
        <div className="cart-confirm-content">
          <h2 id="cart-confirm-title" className="cart-confirm-title">{confirmDialog.title}</h2>
          <p className="cart-confirm-message">{confirmDialog.message}</p>
          {(confirmDialog.flowSteps?.length > 0 || confirmDialog.flowDescription) && (
            <section className="cart-confirm-flow" aria-labelledby="cart-confirm-flow-title">
              <h3 id="cart-confirm-flow-title" className="cart-confirm-flow-title">Después</h3>
              {confirmDialog.flowSteps?.length > 0 ? (
                <ol className="cart-confirm-flow-list">
                  {confirmDialog.flowSteps.map((step, index) => (
                    <li key={index} className="cart-confirm-flow-step">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="cart-confirm-flow-text">{confirmDialog.flowDescription}</p>
              )}
            </section>
          )}
          <div className="cart-confirm-actions">
            <button
              type="button"
              className="cart-confirm-btn cart-confirm-btn--cancel"
              onClick={handleCancelConfirm}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="cart-confirm-btn cart-confirm-btn--confirm"
              onClick={handleConfirmAction}
            >
              {confirmDialog.confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={closeToast} />
      <div className="cart-container">
        <nav className="cart-breadcrumb">
          <Link to="/">Inicio</Link>
          <span>›</span>
          <Link to="/products">Productos</Link>
          <span>›</span>
          <span className="cart-breadcrumb-current">Carrito</span>
        </nav>
        <h1 className="cart-page-title">Carrito de compras</h1>
        <p className="cart-page-subtitle">
          {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
        </p>

        <div className="cart-layout">
          <div className="cart-items-section">
            {itemsByBranch.map((group) => {
              const { branchKey, branchName, items: groupItems } = group;
              const groupSubtotal = groupItems.reduce((s, i) => s + i.subtotal, 0);
              const orderableInBranch = groupItems.filter((i) => isOrderable(i.product));
              const onlyInStore = orderableInBranch.length === 0;
              const pedidoIndex = orderableGroupsForCheckout.findIndex((g) => g.branchKey === branchKey);
              let pedidoLabel;
              if (pedidoIndex < 0) {
                pedidoLabel = `${branchName} (Solo en sucursal)`;
              } else if (isMultiBranch) {
                pedidoLabel = `Pedido ${pedidoIndex + 1} – ${branchName}`;
              } else {
                pedidoLabel = branchName;
              }

              return (
                <section
                  key={branchKey}
                  className="cart-availability-group cart-group-branch"
                  aria-labelledby={`cart-group-title-${branchKey.replaceAll(/\s+/g, '-')}`}
                >
                  <div className="cart-group-header">
                    <span className="cart-group-icon" aria-hidden>
                      {pedidoIndex >= 0 ? '📦' : '📍'}
                    </span>
                    <div className="cart-group-heading">
                      <h3
                        id={`cart-group-title-${branchKey.replaceAll(/\s+/g, '-')}`}
                        className="cart-group-title"
                      >
                        {pedidoLabel}
                      </h3>
                      {onlyInStore && (
                        <p className="cart-group-subtitle">
                          No se incluye en el pedido online. Visita la sucursal para adquirirlos.
                        </p>
                      )}
                    </div>
                    <span className="cart-group-subtotal">{formatPrice(groupSubtotal)}</span>
                  </div>
                  <div className="cart-items-list">
                    {groupItems.map((item) => {
                      const imageUrl = item.product.images?.length > 0 ? item.product.images[0].url : null;
                      const emoji = getProductEmoji(item.product);
                      return (
                        <article key={item.id} className="cart-item-card">
                          <div className="cart-item-image-wrap">
                            {imageUrl ? (
                              <img src={imageUrl} alt={item.product.name} />
                            ) : (
                              <span className="cart-item-emoji">{emoji}</span>
                            )}
                          </div>
                          <div className="cart-item-details">
                            <h3 className="cart-item-name">{item.product.name}</h3>
                            {item.presentation && (
                              <p className="cart-item-presentation">
                                {item.presentation.name} · {item.presentation.quantity}{' '}
                                {item.presentation.quantity === 1 ? 'pieza' : 'piezas'}
                              </p>
                            )}
                            <p className="cart-item-unit-price">{formatPrice(item.unitPrice)} c/u</p>
                          </div>
                          <div className="cart-item-quantity">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              aria-label="Disminuir cantidad"
                            >
                              −
                            </button>
                            <span className="cart-qty-value">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <div className="cart-item-subtotal">{formatPrice(item.subtotal)}</div>
                          <button
                            type="button"
                            className="cart-item-remove"
                            onClick={() => removeFromCart(item.id)}
                            title="Eliminar producto"
                            aria-label="Eliminar producto"
                          >
                            ✕
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="cart-summary-card">
            <h2 className="cart-summary-title">Resumen</h2>
            <div className="cart-summary-rows">
              {orderableGroupsForCheckout.map((group, index) => {
                const subtotal = group.orderableItems.reduce((s, i) => s + i.subtotal, 0);
                const summaryLabel = isMultiBranch
                  ? `📦 Pedido ${index + 1} – ${group.branchName}`
                  : `📦 ${group.branchName}`;
                return (
                  <div key={group.branchKey} className="cart-summary-row">
                    <span className="cart-summary-row-label">{summaryLabel}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                );
              })}
              {itemsByBranch.some(
                (g) => g.items.length > 0 && !g.items.some((item) => isOrderable(item.product))
              ) && (
                <div className="cart-summary-row cart-summary-row--info">
                  <span className="cart-summary-row-label">📍 Solo en sucursal</span>
                  <span className="cart-summary-row-note">No se incluye en el pedido</span>
                </div>
              )}
              <div className="cart-summary-row total">
                <span>Total a pagar</span>
                <span className="amount">{formatPrice(totalOrderable)}</span>
              </div>
            </div>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={creatingOrder || orderableItems.length === 0}
            >
              {creatingOrder ? 'Generando...' : 'Continuar compra'}
            </button>
            {orderableItems.length === 0 && items.length > 0 && (
              <p className="cart-info-only-store">
                Los productos en tu carrito solo están disponibles en sucursal. Visítanos para comprarlos.
              </p>
            )}
            {!isAuthenticated && (
              <p className="cart-login-reminder">
                <Link to="/login">Inicia sesión</Link> para continuar
              </p>
            )}
            <Link to="/products" className="cart-continue-link">
              Seguir comprando
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
