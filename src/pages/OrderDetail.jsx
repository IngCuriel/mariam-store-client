import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getOrderById,
  confirmOrderByCustomer,
  cancelOrder,
} from '../services/ordersService';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CAN_ACCEPT_OR_CANCEL,
  ORDER_STATUS,
  ORDER_TIMELINE_STEPS,
  getTimelineStepIndex,
  STATUS_NEXT_STEP_MESSAGE,
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

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

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

  const handleAcceptOrder = async () => {
    if (!id || !order) return;
    try {
      setActionLoading(true);
      await confirmOrderByCustomer(id);
      showToast('Pedido aceptado. Estamos preparando tu pedido.', 'success');
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

  const handleCancelOrder = async () => {
    if (!id || !order) return;
    if (!window.confirm('¿Cancelar este pedido? Esta acción no se puede deshacer.')) return;
    try {
      setActionLoading(true);
      await cancelOrder(id);
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
  const nextStepMessage = STATUS_NEXT_STEP_MESSAGE[order.status];
  const isFinalState = order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED;
  const showProductAvailability = !isFinalState;

  const hasPartialAvailability =
    showProductAvailability &&
    order.items?.some(
      (i) => i.isAvailable === false || (i.confirmedQuantity != null && i.confirmedQuantity !== i.quantity)
    );

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
            {order.folio && (
              <span className="order-detail-folio-header">Folio {order.folio}</span>
            )}
            <span className="order-detail-meta">
              {formatShortDate(order.createdAt)}
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

          {/* Estado actual + mensaje según estado */}
          <section className="order-detail-status-section">
            <div
              className="order-detail-status-badge"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              <span className="order-detail-status-text">{statusLabel}</span>
            </div>
            {nextStepMessage && (
              <p className="order-detail-next-step-msg">{nextStepMessage}</p>
            )}
          </section>

          {/* Banner: Listo para recoger */}
          {order.status === ORDER_STATUS.READY_FOR_PICKUP && (
            <div className="order-detail-ready-banner">
              <span className="order-detail-ready-icon">✓</span>
              <div>
                <strong>Listo para recoger</strong>
                <p>Pásate por la sucursal a recoger tu pedido.</p>
              </div>
            </div>
          )}

          {/* Banner: Entregado */}
          {order.status === ORDER_STATUS.COMPLETED && (
            <div className="order-detail-ready-banner order-detail-delivered-banner">
              <span className="order-detail-ready-icon">✓</span>
              <div>
                <strong>Pedido entregado</strong>
                <p>Gracias por tu compra.</p>
              </div>
            </div>
          )}

          {order.notes && (
            <p className="order-detail-notes-inline">
              <span className="order-detail-notes-label">Notas: </span>
              {order.notes}
            </p>
          )}

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
                        <span className="order-detail-product-name">{item.productName}</span>
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
              <span className="order-detail-summary-label">Subtotal</span>
              <span className="order-detail-summary-value">
                {formatPrice(
                  order.items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="order-detail-summary-divider" />
            <div className="order-detail-summary-row order-detail-summary-total">
              <span className="order-detail-summary-total-label">Total</span>
              <span className="order-detail-summary-total-value">
                {formatPrice(order.total)}
              </span>
            </div>
          </section>

          {/* Acciones: Aceptar / Cancelar */}
          {canAcceptOrCancel && (
            <div className="order-detail-actions">
              <button
                type="button"
                className="order-detail-btn order-detail-btn-accept"
                onClick={handleAcceptOrder}
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : 'Aceptar pedido actualizado'}
              </button>
              <button
                type="button"
                className="order-detail-btn order-detail-btn-cancel"
                onClick={handleCancelOrder}
                disabled={actionLoading}
              >
                Cancelar pedido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
