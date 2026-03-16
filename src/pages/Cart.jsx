import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductEmoji } from '../services/imageService';
import { createOrder, getDeliveryTypes } from '../services/ordersService';
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
  local_delivery: {
    title: 'Disponible en sucursal',
    subtitle: 'Entrega a domicilio o recoger en tienda',
    description: 'Estos productos tienen inventario local. Una vez confirmado tu pedido, puedes recibirlos a domicilio o recogerlos en sucursal.',
    icon: '🚚',
    orderable: true,
    className: 'cart-group-local',
  },
  online_pickup: {
    title: 'Disponible solo en Tienda Online',
    subtitle: 'Listo en 6 a 12 días',
    description: 'Compra online y recoge en sucursal. Te avisaremos cuando esté listo.',
    icon: '🛒',
    orderable: true,
    className: 'cart-group-online',
  },
  in_store_only: {
    title: 'Solo en sucursal',
    subtitle: 'Servicio presencial',
    description: 'Estos productos o servicios no se envían. Visita la sucursal para adquirirlos. No se incluyen en el pedido online.',
    icon: '📍',
    orderable: false,
    className: 'cart-group-store',
  },
};

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
  });
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [loadingDeliveryTypes, setLoadingDeliveryTypes] = useState(false);
  const pendingConfirmRef = useRef(null);
  const confirmDialogRef = useRef(null);
  const deliveryDialogRef = useRef(null);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (confirmDialog.open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [confirmDialog.open]);

  useEffect(() => {
    const dialog = deliveryDialogRef.current;
    if (!dialog) return;
    if (showDeliveryDialog) dialog.showModal();
    else dialog.close();
  }, [showDeliveryDialog]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const openConfirm = useCallback((title, message, confirmLabel, onConfirm, flowDescription = null) => {
    pendingConfirmRef.current = onConfirm;
    setConfirmDialog({ open: true, title, message, confirmLabel, flowDescription });
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

  const itemsByAvailability = useMemo(() => {
    const groups = { local_delivery: [], online_pickup: [], in_store_only: [] };
    items.forEach((item) => {
      const key = EFFECTIVE_AVAILABILITY(item.product);
      if (groups[key]) groups[key].push(item);
      else groups.local_delivery.push(item);
    });
    return groups;
  }, [items]);

  const orderableItems = useMemo(
    () => items.filter((item) => CART_AVAILABILITY_SECTIONS[EFFECTIVE_AVAILABILITY(item.product)]?.orderable !== false),
    [items]
  );
  const totalOrderable = orderableItems.reduce((sum, item) => sum + item.subtotal, 0);

  const orderableGroups = useMemo(
    () => ['local_delivery', 'online_pickup'].filter((key) => (itemsByAvailability[key] || []).length > 0),
    [itemsByAvailability]
  );
  const numOrders = orderableGroups.length;
  const deliveryCostPerOrder = selectedDeliveryType?.cost ?? 0;
  const totalWithDelivery = totalOrderable + deliveryCostPerOrder * numOrders;

  const openDeliveryDialog = useCallback(async () => {
    setShowDeliveryDialog(true);
    if (deliveryTypes.length === 0) {
      setLoadingDeliveryTypes(true);
      try {
        const types = await getDeliveryTypes();
        setDeliveryTypes(types);
        if (types.length > 0) setSelectedDeliveryType(types[0]);
      } catch (e) {
        showToast('No se pudieron cargar las opciones de entrega. Intenta de nuevo.', 'error');
        setShowDeliveryDialog(false);
      } finally {
        setLoadingDeliveryTypes(false);
      }
    }
  }, [deliveryTypes.length, showToast]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      openConfirm(
        'Iniciar sesión',
        'Necesitas iniciar sesión para generar tu pedido. ¿Deseas ir a la página de acceso?',
        'Ir a iniciar sesión',
        () => navigate('/login', { state: { from: '/cart' } })
      );
      return;
    }

    if (orderableItems.length === 0) {
      showToast('Agrega al menos un producto que se pueda pedir en línea para generar tu pedido.', 'info');
      return;
    }

    openDeliveryDialog();
  };

  const handleDeliveryContinue = () => {
    if (deliveryTypes.length > 0 && !selectedDeliveryType) {
      showToast('Elige una forma de entrega.', 'info');
      return;
    }
    setShowDeliveryDialog(false);
    const delivery = selectedDeliveryType ?? null;
    const isDelivery = delivery?.code === 'delivery';
    const isPickup = delivery?.code === 'pickup';
    const message =
      numOrders > 1
        ? `Se generarán ${numOrders} pedidos. Total: ${formatPrice(totalWithDelivery)}${deliveryCostPerOrder > 0 ? ` (incl. envío)` : ''}.`
        : `Total a pagar: ${formatPrice(totalWithDelivery)}.`;
    const step2 =
      isDelivery
        ? 'En "Mis pedidos" podrás ver el estado y, cuando esté listo, confirmar tu dirección de envío para que te enviemos a domicilio.'
        : isPickup
          ? 'En el menu de "Mis Pedidos" podrás ver estatus y dar seguimiento a tu pedido.'
          : 'En "Mis pedidos" podrás ver el estado y, cuando esté listo, confirmar si enviamos a domicilio o recoges en sucursal.';
    const step3 =
      isDelivery
        ? 'Te avisaremos cuando tu pedido esté en camino a tu domicilio.'
        : isPickup
          ? 'Te avisaremos cuando tu pedido esté listo para recoger en sucursal.'
          : 'Te avisaremos cuando tu pedido esté en camino o listo para recoger.';
    const flowDescription = `1) La tienda revisará la disponibilidad de los productos y te notificará para que nos apoyes a confirmar el pedido. 2) ${step2} 3) ${step3}`;
    openConfirm('Confirmar pedido', message, 'Generar pedido', () => submitOrder(delivery), flowDescription);
  };

  const submitOrder = async (deliveryType) => {
    try {
      setCreatingOrder(true);

      for (const groupKey of orderableGroups) {
        const groupItems = itemsByAvailability[groupKey] || [];
        if (groupItems.length === 0) continue;

        const config = CART_AVAILABILITY_SECTIONS[groupKey];
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

        const payload = {
          items: orderItems,
          notes: `Pedido web - ${config.title} (${groupItems.length} ${groupItems.length === 1 ? 'producto' : 'productos'})`,
          orderAvailability: groupKey,
        };
        if (deliveryType?.id) {
          payload.deliveryTypeId = deliveryType.id;
          payload.deliveryCost = deliveryType.cost ?? 0;
        }

        await createOrder(payload);
      }

      removeItemsFromCart(orderableItems.map((item) => item.id));
      showToast(
        numOrders > 1
          ? `Se generaron ${numOrders} pedidos correctamente. La tienda te contactará pronto.`
          : 'Pedido generado correctamente. La tienda te contactará pronto.',
        'success'
      );
      navigate('/products');
    } catch (error) {
      showToast(
        error.response?.data?.error || 'No se pudo generar el pedido. Intenta de nuevo.',
        'error'
      );
    } finally {
      setCreatingOrder(false);
    }
  };

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
      <dialog
        ref={deliveryDialogRef}
        className="cart-delivery-dialog"
        aria-labelledby="cart-delivery-title"
        onClose={() => setShowDeliveryDialog(false)}
        onCancel={() => setShowDeliveryDialog(false)}
      >
        <div className="cart-delivery-content">
          <h2 id="cart-delivery-title" className="cart-delivery-title">
            {deliveryTypes.length === 1 ? 'Forma de entrega' : 'Elige la forma de entrega'}
          </h2>
          {loadingDeliveryTypes ? (
            <p className="cart-delivery-loading">Cargando opciones...</p>
          ) : deliveryTypes.length === 0 ? (
            <p className="cart-delivery-empty">No hay opciones de entrega configuradas. Puedes continuar sin seleccionar.</p>
          ) : (
            <>
              {deliveryTypes.length === 1 && (
                <p className="cart-delivery-single-note" role="status">
                  Por el momento solo contamos con la siguiente forma de entrega. Confírmala para continuar con tu compra.
                </p>
              )}
              <div className="cart-delivery-options" role="group" aria-label="Forma de entrega">
              {deliveryTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`cart-delivery-option ${selectedDeliveryType?.id === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDeliveryType(type)}
                >
                  <span className="cart-delivery-option-name">{type.name}</span>
                  <span className="cart-delivery-option-cost">
                    {type.cost > 0 ? formatPrice(type.cost) : 'Sin costo'}
                  </span>
                </button>
              ))}
            </div>
            </>
          )}
          {deliveryTypes.length > 0 && selectedDeliveryType && (
            <>
              {selectedDeliveryType.code === 'delivery' && (
                <>
                  <p className="cart-delivery-address-note" role="status">
                    La dirección de envío la indicarás cuando la tienda confirme tu pedido.
                  </p>
                  <p className="cart-delivery-total">
                    Total con envío: <strong>{formatPrice(totalWithDelivery)}</strong>
                    {deliveryCostPerOrder > 0 && numOrders > 0 && (
                      <span className="cart-delivery-note"> (incl. {formatPrice(deliveryCostPerOrder)} por pedido)</span>
                    )}
                  </p>
                </>
              )}
            </>
          )}
          <div className="cart-delivery-actions">
            <button type="button" className="cart-confirm-btn cart-confirm-btn--cancel" onClick={() => setShowDeliveryDialog(false)}>
              Cancelar
            </button>
            <button type="button" className="cart-confirm-btn cart-confirm-btn--confirm" onClick={handleDeliveryContinue}>
              Continuar
            </button>
          </div>
        </div>
      </dialog>
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
          {confirmDialog.flowDescription && (
            <div className="cart-confirm-flow" role="region" aria-label="Qué pasa después">
              <h3 className="cart-confirm-flow-title">¿Qué pasa después?</h3>
              <p className="cart-confirm-flow-text">{confirmDialog.flowDescription}</p>
            </div>
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
            {(['local_delivery', 'online_pickup', 'in_store_only']).map((groupKey) => {
              const groupItems = itemsByAvailability[groupKey] || [];
              if (groupItems.length === 0) return null;

              const config = CART_AVAILABILITY_SECTIONS[groupKey];
              const groupSubtotal = groupItems.reduce((s, i) => s + i.subtotal, 0);

              return (
                <section
                  key={groupKey}
                  className={`cart-availability-group ${config.className}`}
                  aria-labelledby={`cart-group-title-${groupKey}`}
                >
                  <div className="cart-group-header">
                    <span className="cart-group-icon" aria-hidden>{config.icon}</span>
                    <div className="cart-group-heading">
                      <h3 id={`cart-group-title-${groupKey}`} className="cart-group-title">
                        {config.title}
                      </h3>
                      <p className="cart-group-subtitle">{config.subtitle}</p>
                    </div>
                    <span className="cart-group-subtotal">{formatPrice(groupSubtotal)}</span>
                  </div>
                  <p className="cart-group-description">{config.description}</p>
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
              {(['local_delivery', 'online_pickup']).map((key) => {
                const groupItems = itemsByAvailability[key] || [];
                if (groupItems.length === 0) return null;
                const config = CART_AVAILABILITY_SECTIONS[key];
                const subtotal = groupItems.reduce((s, i) => s + i.subtotal, 0);
                return (
                  <div key={key} className="cart-summary-row">
                    <span className="cart-summary-row-label">
                      {config.icon} {config.title}
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                );
              })}
              {itemsByAvailability.in_store_only?.length > 0 && (
                <div className="cart-summary-row cart-summary-row--info">
                  <span className="cart-summary-row-label">
                    {CART_AVAILABILITY_SECTIONS.in_store_only.icon} Solo en sucursal
                  </span>
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
              {creatingOrder ? 'Generando pedido...' : 'Continuar Compra'}
            </button>
            {orderableItems.length === 0 && items.length > 0 && (
              <p className="cart-info-only-store">
                Los productos en tu carrito solo están disponibles en sucursal. Visítanos para comprarlos.
              </p>
            )}
            {!isAuthenticated && (
              <p className="cart-login-reminder">
                <Link to="/login">Inicia sesión</Link> para poder generar tu pedido
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
