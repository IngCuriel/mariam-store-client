import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getOrderById,
  confirmOrderByCustomer,
  cancelOrder,
} from '../services/ordersService';
import { getMyAddresses, createAddress } from '../services/addressesService';
import { DELIVERY_POSTAL_CODE, DELIVERY_CITY, DELIVERY_STATE } from '../constants/deliveryZone';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CAN_ACCEPT_OR_CANCEL,
  ORDER_STATUS,
  ORDER_TIMELINE_STEPS,
  getTimelineStepIndex,
  STATUS_NEXT_STEP_MESSAGE,
  NO_AVAILABILITY_MESSAGE,
} from '../constants/orderStatus';
import { Toast } from '../components/Toast';
import './OrderDetail.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
};

const formatShortDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
};

/** Cantidad efectiva para mostrar (confirmada o solicitada según disponibilidad) */
function effectiveQuantity(item) {
  if (item.confirmedQuantity != null) return item.confirmedQuantity;
  if (item.isAvailable === true) return item.quantity;
  if (item.isAvailable === false) return 0;
  return item.quantity; // pendiente de revisión: mostramos solicitada
}

const INITIAL_ADDRESS_FORM = {
  label: 'Casa',
  street: '',
  colony: '',
  references: '',
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState(INITIAL_ADDRESS_FORM);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');
  const addressDialogRef = useRef(null);
  const cancelDialogRef = useRef(null);

  const CANCEL_REASON_OPTIONS = [
    { value: '', label: 'Seleccionar motivo (opcional)' },
    { value: 'Ya no necesito el pedido', label: 'Ya no necesito el pedido' },
    { value: 'Encontré los productos en otro lugar', label: 'Encontré los productos en otro lugar' },
    { value: 'Cambié de opinión', label: 'Cambié de opinión' },
    { value: 'Otro', label: 'Otro' },
  ];

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoadError(null);
    try {
      setLoading(true);
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error('Error cargando pedido:', err);
      setOrder(null);
      setLoadError(err?.message || 'No se pudo cargar el pedido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    const dialog = addressDialogRef.current;
    if (!dialog) return;
    if (showAddressModal) dialog.showModal();
    else dialog.close();
  }, [showAddressModal]);

  useEffect(() => {
    const dialog = cancelDialogRef.current;
    if (!dialog) return;
    if (showCancelConfirm) dialog.showModal();
    else dialog.close();
  }, [showCancelConfirm]);

  useEffect(() => {
    if (!showAddressModal) return;
    let cancelled = false;
    setLoadingAddresses(true);
    getMyAddresses()
      .then((list) => {
        if (!cancelled) {
          setSavedAddresses(Array.isArray(list) ? list : []);
          const defaultAddr = list?.find((a) => a.isDefault) || list?.[0];
          setSelectedAddressId(defaultAddr?.id ?? null);
          setShowNewAddressForm(list?.length === 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedAddresses([]);
          setShowNewAddressForm(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAddresses(false);
      });
    return () => { cancelled = true; };
  }, [showAddressModal]);

  const handleAcceptOrder = async (payload = {}) => {
    if (!id || !order) return;
    try {
      setActionLoading(true);
      await confirmOrderByCustomer(id, payload);
      showToast('Pedido aceptado. Estamos preparando tu pedido.', 'success');
      setShowAddressModal(false);
      setAddressForm(INITIAL_ADDRESS_FORM);
      setShowNewAddressForm(false);
      await loadOrder();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'No se pudo aceptar el pedido. Intenta de nuevo.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const isDeliveryOrder = order?.deliveryType?.code === 'delivery';
  const needsDeliveryAddress = isDeliveryOrder && !order?.deliveryAddress;

  const handleAcceptClick = () => {
    if (needsDeliveryAddress) {
      setShowAddressModal(true);
    } else {
      handleAcceptOrder();
    }
  };

  const handleUseSavedAddress = () => {
    if (selectedAddressId != null) {
      handleAcceptOrder({ addressId: selectedAddressId });
    } else {
      showToast('Elige una dirección o agrega una nueva.', 'info');
    }
  };

  const handleSubmitNewAddress = async (e) => {
    e.preventDefault();
    const street = addressForm.street?.trim();
    const colony = addressForm.colony?.trim();
    if (!street || !colony) {
      showToast('Completa calle y colonia.', 'info');
      return;
    }
    try {
      setActionLoading(true);
      const newAddr = await createAddress({
        label: addressForm.label?.trim() || 'Casa',
        street,
        colony,
        postalCode: DELIVERY_POSTAL_CODE,
        city: DELIVERY_CITY,
        state: DELIVERY_STATE,
        references: addressForm.references?.trim() || undefined,
        isDefault: savedAddresses.length === 0,
      });
      await handleAcceptOrder({ addressId: newAddr.id });
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo guardar la dirección.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelConfirm = () => setShowCancelConfirm(true);

  const handleConfirmCancelOrder = async () => {
    if (!id || !order) return;
    const reasonToSend = cancelReason === 'Otro' ? cancelReasonOther.trim() : (cancelReason || null);
    try {
      setActionLoading(true);
      setShowCancelConfirm(false);
      setCancelReason('');
      setCancelReasonOther('');
      await cancelOrder(id, reasonToSend ? { reason: reasonToSend } : {});
      showToast('Pedido cancelado.', 'info');
      await loadOrder();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'No se pudo cancelar el pedido.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-loading">
          <div className="order-detail-spinner">⏳</div>
          <p>Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-error">
          <div className="order-detail-error-icon">⚠️</div>
          <h2>Pedido no encontrado</h2>
          <p>
            {loadError || 'El pedido que buscas no existe o no tienes permiso para verlo.'}
          </p>
          <button
            type="button"
            className="order-detail-back-btn"
            onClick={() => navigate('/orders')}
          >
            Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  const canAcceptOrCancel = CAN_ACCEPT_OR_CANCEL.includes(order.status);
  const statusColor = STATUS_COLORS[order.status] || '#95a5a6';
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const currentStepIndex = getTimelineStepIndex(order.status);
  const deliveryCode = order.deliveryType?.code?.toLowerCase?.();
  const nextStepMessage =
    order.status === ORDER_STATUS.IN_PREPARATION
      ? deliveryCode === 'delivery'
        ? 'Tu pedido está en preparación. Te avisaremos cuando esté en camino a tu domicilio.'
        : deliveryCode === 'pickup'
          ? 'Tu pedido está en preparación. Te avisaremos cuando esté listo para recoger en sucursal.'
          : STATUS_NEXT_STEP_MESSAGE[ORDER_STATUS.IN_PREPARATION]
      : STATUS_NEXT_STEP_MESSAGE[order.status];
  const isFinalState = order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED;
  const showProductAvailability = !isFinalState;

  const hasPartialAvailability =
    showProductAvailability &&
    order.items?.some(
      (i) => i.isAvailable === false || (i.confirmedQuantity != null && i.confirmedQuantity !== i.quantity)
    );

  const noProductsAvailable =
    canAcceptOrCancel &&
    (order.total === 0 ||
      (order.items?.length > 0 &&
        order.items.every((item) => (item.confirmedQuantity ?? 0) === 0)));

  const statusMessageText = noProductsAvailable ? null : nextStepMessage;

  return (
    <div className="order-detail-page">
      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={closeToast} />
      <div className="order-detail-container">
        <header className="order-detail-header">
          <button
            type="button"
            className="order-detail-back-header"
            onClick={() => navigate('/orders')}
          >
            ← Volver
          </button>
          <div className="order-detail-header-center">
            <h1 className="order-detail-title">Detalle del pedido</h1>
            <span className="order-detail-folio-header">Folio {order.id}</span>
            <span className="order-detail-meta">
              <time dateTime={order.createdAt} title="Fecha y hora del pedido">
                Pedido del {formatDate(order.createdAt)}
              </time>
              {order.branch && ` · ${order.branch.name}`}
            </span>
          </div>
          <span className="order-detail-spacer" aria-hidden="true" />
        </header>

        <div className="order-detail-content">
          {/* Timeline de seguimiento (oculto si cancelado) */}
          {order.status !== ORDER_STATUS.CANCELLED && (
            <section className="order-detail-timeline-wrap" aria-label="Seguimiento del pedido">
              <div className="order-detail-timeline">
                {ORDER_TIMELINE_STEPS.map((step, i) => {
                  const isDone = currentStepIndex > i;
                  const isCurrent = currentStepIndex === i;
                  return (
                    <div
                      key={step.key}
                      className={`order-detail-timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="order-detail-timeline-dot">
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className="order-detail-timeline-label">{step.label}</span>
                      {i < ORDER_TIMELINE_STEPS.length - 1 && (
                        <div className="order-detail-timeline-line" />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Estado del pedido + mensaje según estado */}
          <section className="order-detail-status-section" aria-label="Estado del pedido">
            <p className="order-detail-status-label">Estado del pedido</p>
            <div
              className="order-detail-status-badge"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              <span className="order-detail-status-text">{statusLabel}</span>
            </div>
            {statusMessageText && (
              <p className="order-detail-next-step-msg">{statusMessageText}</p>
            )}
            {order.status === ORDER_STATUS.CANCELLED && order.cancellationReason && (
              <p className="order-detail-cancellation-reason" role="status">
                {order.cancellationReason}
              </p>
            )}
          </section>

          {/* Bloque especial: ningún producto disponible — mensaje amigable y acciones */}
          {noProductsAvailable && (
            <div className="order-detail-no-availability-card" role="status">
              <p className="order-detail-no-availability-title">{NO_AVAILABILITY_MESSAGE.title}</p>
              <p className="order-detail-no-availability-body">{NO_AVAILABILITY_MESSAGE.body}</p>
              <div className="order-detail-no-availability-actions">
                <button
                  type="button"
                  className="order-detail-btn order-detail-btn-accept"
                  onClick={() => navigate('/products')}
                >
                  {NO_AVAILABILITY_MESSAGE.ctaExplore}
                </button>
                <button
                  type="button"
                  className="order-detail-btn order-detail-btn-cancel"
                  onClick={openCancelConfirm}
                  disabled={actionLoading}
                >
                  {NO_AVAILABILITY_MESSAGE.ctaCancel}
                </button>
              </div>
            </div>
          )}

          {/* Tipo de entrega (si aplica) */}
          {order.deliveryType && (
            <p className="order-detail-delivery-type">
              Forma de entrega: <strong>{order.deliveryType.name}</strong>
              {order.deliveryCost != null && order.deliveryCost > 0 && (
                <span> · {formatPrice(order.deliveryCost)}</span>
              )}
            </p>
          )}

          {/* Banner: Listo para recoger + datos de la sucursal */}
          {order.status === ORDER_STATUS.READY_FOR_PICKUP && (
            <div className="order-detail-ready-banner">
              <span className="order-detail-ready-icon">✓</span>
              <div className="order-detail-ready-content">
                {/*<strong>Listo para recoger</strong>*/}
                <p>
                  {order.readyAt
                    ? `Disponible apartir del ${formatDate(order.readyAt)}.`
                    : 'Pásate por la sucursal a recoger tu pedido.'}
                </p>
                {(order.branch || order.deliveryType?.code === 'pickup') && (
                  <div className="order-detail-branch-pickup" role="region" aria-label="Datos de la sucursal">
                    <p className="order-detail-branch-pickup-title">📍 Pasa a recoger a:</p>
                    {order.branch ? (
                      <div className="order-detail-branch-pickup-card">
                        {order.branch.logo && (
                          <img
                            src={order.branch.logo}
                            alt=""
                            className="order-detail-branch-pickup-logo"
                          />
                        )}
                        <div className="order-detail-branch-pickup-data">
                          <p className="order-detail-branch-pickup-name">{order.branch.name}</p>
                          {order.branch.description && (
                            <p className="order-detail-branch-pickup-address">{order.branch.description}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="order-detail-branch-pickup-fallback">
                        Contacta a la tienda para confirmar la sucursal y horario de recolección.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Banner: En camino */}
          {order.status === ORDER_STATUS.IN_TRANSIT && (
            <div className="order-detail-ready-banner order-detail-transit-banner">
              <span className="order-detail-ready-icon">🚚</span>
              <div>
                <strong>Tu pedido está en camino</strong>
                <p>
                  {order.readyAt
                    ? `Enviado el ${formatDate(order.readyAt)}. Llegará pronto a tu domicilio.`
                    : 'Te avisaremos cuando esté cerca.'}
                </p>
              </div>
            </div>
          )}

          {/* Banner: Entregado */}
          {order.status === ORDER_STATUS.COMPLETED && (
            <div className="order-detail-ready-banner order-detail-delivered-banner">
              <span className="order-detail-ready-icon">✓</span>
              <div>
                <strong>Pedido entregado</strong>
                <p>
                  {order.deliveredAt
                    ? `Entregado el ${formatDate(order.deliveredAt)}. Gracias por tu compra.`
                    : 'Gracias por tu compra.'}
                </p>
              </div>
            </div>
          )}

          {/*order.notes && (
            <p className="order-detail-notes-inline">
              <span className="order-detail-notes-label">Notas: </span>
              {order.notes}
            </p>
          )*/}

          {/* Productos */}
          <section className="order-detail-info-card order-detail-products-card">
            <h2 className="order-detail-section-title">
              Productos <span className="order-detail-count">({order.items?.length || 0})</span>
            </h2>
            {hasPartialAvailability && (
              <div className="order-detail-availability-summary" role="alert">
                <span className="order-detail-availability-summary-icon">ℹ️</span>
                <p>
                  Algunos productos tienen disponibilidad limitada. Revisa las cantidades disponibles y el total antes de aceptar.
                </p>
              </div>
            )}
            <div className="order-detail-products-list">
              {order.items?.map((item, index) => {
                const available = item.isAvailable === true;
                const unavailable = item.isAvailable === false;
                const pending = item.isAvailable === null || item.isAvailable === undefined;
                const effQty = effectiveQuantity(item);
                return (
                  <div key={item.id} className="order-detail-product-card">
                    <div className="order-detail-product-header">
                      <div className="order-detail-product-num">{index + 1}</div>
                      <div className="order-detail-product-info">
                        {item.productId ? (
                          <Link
                            to={`/products/${item.productId}`}
                            className="order-detail-product-name order-detail-product-name-link"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          <span className="order-detail-product-name">{item.productName}</span>
                        )}
                        {item.presentationName && (
                          <span className="order-detail-product-presentation">
                            Presentación: {item.presentationName}
                            {item.presentationQuantity != null && (
                              <span className="order-detail-product-presentation-pieces">
                                {' '}({item.presentationQuantity}{' '}
                                {item.presentationQuantity === 1 ? 'pieza' : 'piezas'})
                              </span>
                            )}
                          </span>
                        )}
                        <span className="order-detail-product-details">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </span>
                      </div>
                    </div>
                    {showProductAvailability && (
                      <div className="order-detail-availability-display">
                        {unavailable && (
                          <div className="order-detail-availability-row order-detail-availability-unavailable">
                            <span className="order-detail-availability-row-icon">✕</span>
                            <span>No disponible en este momento</span>
                          </div>
                        )}
                        {available && item.confirmedQuantity != null && item.confirmedQuantity !== item.quantity && (
                          <div className="order-detail-availability-row order-detail-availability-partial">
                            <span className="order-detail-availability-row-icon">✓</span>
                            <span>
                              Disponible: <strong>{item.confirmedQuantity}</strong> de <strong>{item.quantity}</strong> unidades
                            </span>
                          </div>
                        )}
                        {available && (item.confirmedQuantity == null || item.confirmedQuantity === item.quantity) && (
                          <div className="order-detail-availability-row order-detail-availability-full">
                            <span className="order-detail-availability-row-icon">✔</span>
                            <span>Disponible</span>
                          </div>
                        )}
                        {pending && (
                          <div className="order-detail-availability-row order-detail-availability-pending">
                            <span className="order-detail-availability-row-icon">?</span>
                            <span>Pendiente de revisión</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="order-detail-product-footer">
                      <span className="order-detail-product-subtotal">
                        {formatPrice((effQty * item.unitPrice) || item.subtotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Resumen */}
          <section className="order-detail-summary-card">
            <div className="order-detail-summary-row">
              <span className="order-detail-summary-label">Subtotal (productos)</span>
              <span className="order-detail-summary-value">
                {formatPrice(
                  order.items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0
                )}
              </span>
            </div>
            {order.deliveryType && order.deliveryCost != null && Number(order.deliveryCost) > 0 && (
              <div className="order-detail-summary-row">
                <span className="order-detail-summary-label">Costo de envío</span>
                <span className="order-detail-summary-value">
                  {formatPrice(Number(order.deliveryCost))}
                </span>
              </div>
            )}
            <div className="order-detail-summary-divider" />
            <div className="order-detail-summary-row order-detail-summary-total">
              <span className="order-detail-summary-total-label">Total</span>
              <span className="order-detail-summary-total-value">
                {formatPrice(order.total)}
              </span>
            </div>
          </section>

          {/* Acciones: Aceptar / Cancelar (solo cuando hay productos disponibles para aceptar) */}
          {canAcceptOrCancel && !noProductsAvailable && (
            <div className="order-detail-actions">
              {needsDeliveryAddress && (
                <p className="order-detail-delivery-address-hint">
                  Es envío a domicilio. Al aceptar el pedido te pediremos tu dirección de entrega.
                </p>
              )}
              <button
                type="button"
                className="order-detail-btn order-detail-btn-accept"
                onClick={handleAcceptClick}
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : 'Aceptar pedido actualizado'}
              </button>
              <button
                type="button"
                className="order-detail-btn order-detail-btn-cancel"
                onClick={openCancelConfirm}
                disabled={actionLoading}
              >
                Cancelar pedido
              </button>
            </div>
          )}

          {/* Historial de estados (timeline con fechas/horas) — al final */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <section className="order-detail-history" aria-label="Historial del pedido">
              <h3 className="order-detail-history-title">Seguimiento</h3>
              <ul className="order-detail-history-list">
                {order.statusHistory.map((entry) => (
                  <li key={`${entry.status}-${entry.createdAt}`} className="order-detail-history-item">
                    <span className="order-detail-history-dot" aria-hidden="true" />
                    <div className="order-detail-history-content">
                      <span className="order-detail-history-label">
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </span>
                      <time className="order-detail-history-date" dateTime={entry.createdAt}>
                        {formatDate(entry.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Modal: confirmar cancelación de pedido */}
      <dialog
        ref={cancelDialogRef}
        className="order-detail-cancel-dialog"
        aria-labelledby="order-detail-cancel-title"
        aria-describedby="order-detail-cancel-desc"
        onClose={() => {
          setShowCancelConfirm(false);
          setCancelReason('');
          setCancelReasonOther('');
        }}
        onCancel={() => {
          setShowCancelConfirm(false);
          setCancelReason('');
          setCancelReasonOther('');
        }}
      >
        <div className="order-detail-cancel-dialog-content">
          <div className="order-detail-cancel-dialog-icon" aria-hidden="true">
            ⚠️
          </div>
          <h2 id="order-detail-cancel-title" className="order-detail-cancel-dialog-title">
            ¿Cancelar pedido?
          </h2>
          <p id="order-detail-cancel-desc" className="order-detail-cancel-dialog-desc">
            Esta acción no se puede deshacer. El pedido quedará cancelado y no podrás recuperarlo.
          </p>
          <label htmlFor="order-detail-cancel-reason" className="order-detail-cancel-reason-label">
            Motivo de cancelación (opcional)
          </label>
          <select
            id="order-detail-cancel-reason"
            className="order-detail-cancel-reason-select"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            aria-describedby="order-detail-cancel-desc"
          >
            {CANCEL_REASON_OPTIONS.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {cancelReason === 'Otro' && (
            <input
              type="text"
              className="order-detail-cancel-reason-other"
              placeholder="Escribe el motivo"
              value={cancelReasonOther}
              onChange={(e) => setCancelReasonOther(e.target.value)}
              maxLength={200}
              aria-label="Motivo de cancelación (otro)"
            />
          )}
          <div className="order-detail-cancel-dialog-actions">
            <button
              type="button"
              className="order-detail-btn order-detail-btn-cancel"
              onClick={() => {
                setShowCancelConfirm(false);
                setCancelReason('');
                setCancelReasonOther('');
              }}
              disabled={actionLoading}
            >
              No, mantener pedido
            </button>
            <button
              type="button"
              className="order-detail-btn order-detail-btn-cancel-confirm"
              onClick={handleConfirmCancelOrder}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelando...' : 'Sí, cancelar pedido'}
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal: dirección de envío (solo cuando es envío a domicilio y falta dirección) */}
      <dialog
        ref={addressDialogRef}
        className="order-detail-address-dialog"
        aria-labelledby="order-detail-address-title"
        aria-describedby="order-detail-address-desc"
        onClose={() => setShowAddressModal(false)}
        onCancel={() => setShowAddressModal(false)}
      >
        <div className="order-detail-address-dialog-content">
          <button
            type="button"
            className="order-detail-address-dialog-close"
            onClick={() => setShowAddressModal(false)}
            disabled={actionLoading}
            aria-label="Cerrar"
          >
            ×
          </button>
          <div className="order-detail-address-dialog-icon" aria-hidden="true">
            📍
          </div>
          <h2 id="order-detail-address-title" className="order-detail-address-dialog-title">
            Dirección de envío
          </h2>
          <p id="order-detail-address-desc" className="order-detail-address-dialog-desc">
            Elige una dirección guardada o agrega una nueva. La usaremos solo para esta entrega.
          </p>

          {loadingAddresses ? (
            <p className="order-detail-address-loading">Cargando direcciones...</p>
          ) : (
            <>
              {savedAddresses.length === 0 && !showNewAddressForm && (
                <p className="order-detail-address-empty-hint">
                  No tienes direcciones guardadas. Registra una para enviar tu pedido.
                </p>
              )}
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <div className="order-detail-address-catalog" role="listbox" aria-label="Direcciones guardadas">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      role="option"
                      aria-selected={selectedAddressId === addr.id}
                      className={`order-detail-address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <span className="order-detail-address-card-label">
                        {addr.label}
                        {addr.isDefault && <span className="order-detail-address-card-default">Predeterminada</span>}
                      </span>
                      <span className="order-detail-address-card-line">{addr.street}</span>
                      <span className="order-detail-address-card-line">
                        {addr.colony}, {addr.postalCode} {addr.city}
                        {addr.state ? `, ${addr.state}` : ''}
                      </span>
                      {addr.references?.trim() && (
                        <span className="order-detail-address-card-ref">Ref: {addr.references}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!showNewAddressForm ? (
                <div className="order-detail-address-actions-wrap">
                  <button
                    type="button"
                    className="order-detail-address-add-new"
                    onClick={() => setShowNewAddressForm(true)}
                  >
                    + {savedAddresses.length > 0 ? 'Agregar nueva dirección' : 'Registrar mi dirección'}
                  </button>
                  <div className="order-detail-address-actions">
                    <button
                      type="button"
                      className="order-detail-btn order-detail-btn-cancel"
                      onClick={() => setShowAddressModal(false)}
                      disabled={actionLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="order-detail-btn order-detail-btn-accept"
                      disabled={actionLoading || (savedAddresses.length > 0 && selectedAddressId == null)}
                      onClick={handleUseSavedAddress}
                    >
                      {actionLoading ? 'Procesando...' : 'Enviar a esta dirección y aceptar pedido'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitNewAddress} className="order-detail-address-form">
                  <p className="order-detail-address-zone-note">
                    Envío solo a C.P. {DELIVERY_POSTAL_CODE}. Completa los datos faltantes.
                  </p>
                  <label htmlFor="order-address-label" className="order-detail-address-label">Nombre (ej. Casa, Oficina)</label>
                  <input
                    id="order-address-label"
                    type="text"
                    className="order-detail-address-input"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Casa"
                  />
                  <label htmlFor="order-address-street" className="order-detail-address-label">
                    Calle y número <span className="order-detail-address-required">*</span>
                  </label>
                  <input
                    id="order-address-street"
                    type="text"
                    className="order-detail-address-input"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                    placeholder="Ej. Av. Principal 123"
                    required
                    autoComplete="street-address"
                  />
                  <label htmlFor="order-address-colony" className="order-detail-address-label">
                    Colonia <span className="order-detail-address-required">*</span>
                  </label>
                  <input
                    id="order-address-colony"
                    type="text"
                    className="order-detail-address-input"
                    value={addressForm.colony}
                    onChange={(e) => setAddressForm((p) => ({ ...p, colony: e.target.value }))}
                    placeholder="Ej. Centro"
                    required
                  />
                  <label htmlFor="order-address-references" className="order-detail-address-label">Referencias (opcional)</label>
                  <input
                    id="order-address-references"
                    type="text"
                    className="order-detail-address-input"
                    value={addressForm.references}
                    onChange={(e) => setAddressForm((p) => ({ ...p, references: e.target.value }))}
                    placeholder="Ej. Entre X y Y, casa de color..."
                  />
                  <div className="order-detail-address-actions">
                    <button
                      type="button"
                      className="order-detail-btn order-detail-btn-cancel"
                      onClick={() => setShowNewAddressForm(false)}
                      disabled={actionLoading}
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      className="order-detail-btn order-detail-btn-accept"
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Procesando...' : 'Guardar dirección y aceptar pedido'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
          </div>
        </dialog>
    </div>
  );
}
