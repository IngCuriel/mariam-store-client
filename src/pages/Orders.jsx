import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, cancelOrder } from '../services/ordersService';
import {
  ORDER_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_OPTIONS_FILTER,
  STATUS_LIST_MESSAGE,
  FILTER_NEEDS_CONFIRMATION,
  CAN_ACCEPT_OR_CANCEL,
} from '../constants/orderStatus';
import { getOrderDeliveryDisplay, getOrderAvailabilityFromNotes, getReadyAtAvailabilityMessage } from '../utils/orderAvailability';
import { Toast } from '../components/Toast';
import './Orders.css';

const STATUS_OPTIONS = STATUS_OPTIONS_FILTER;
const ORDERS_NEED_CONFIRM_LIMIT = 200;

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatShortDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    console.warn('formatShortDate:', e);
    return String(dateString);
  }
};

const formatShortDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return String(dateString);
  }
};

const ORDERS_PER_PAGE = 5;

/** Genera números de página para mostrar (estilo ML/Amazon: 1 ... 4 5 6 ... 12) */
function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [];
  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
  }
  return pages;
}

function getItemAvailabilityDisplay(item) {
  const available = item.isAvailable === true;
  const unavailable = item.isAvailable === false;
  if (available) {
    return { statusClass: 'orders-confirm-dialog-product--available', statusLabel: 'Disponible', statusIcon: '✓' };
  }
  if (unavailable) {
    return { statusClass: 'orders-confirm-dialog-product--unavailable', statusLabel: 'No disponible', statusIcon: '✕' };
  }
  return { statusClass: 'orders-confirm-dialog-product--pending', statusLabel: 'En revisión', statusIcon: '○' };
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [ordersNeedingConfirmationList, setOrdersNeedingConfirmationList] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: ORDERS_PER_PAGE,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [confirmModalOrder, setConfirmModalOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const confirmDialogRef = useRef(null);
  const navigate = useNavigate();

  const showToast = (message, type = 'info') => {
    setToast({ open: true, message, type });
  };

  const loadOrders = useCallback(async (status, page = 1) => {
    try {
      setLoading(true);
      if (status === FILTER_NEEDS_CONFIRMATION && page === 1) {
        const data = await getOrders(undefined, 1, ORDERS_NEED_CONFIRM_LIMIT);
        const all = (data.orders && Array.isArray(data.orders) ? data.orders : [])
          .filter((o) => CAN_ACCEPT_OR_CANCEL.includes(o.status))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrdersNeedingConfirmationList(all);
        const total = all.length;
        const totalPages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
        setOrders(all.slice(0, ORDERS_PER_PAGE));
        setPagination({
          page: 1,
          limit: ORDERS_PER_PAGE,
          total,
          totalPages,
          hasNext: totalPages > 1,
          hasPrev: false,
        });
      } else if (status !== FILTER_NEEDS_CONFIRMATION) {
        setOrdersNeedingConfirmationList([]);
        const data = await getOrders(status || undefined, page, ORDERS_PER_PAGE);
        const orderList = data.orders && Array.isArray(data.orders) ? data.orders : [];
        setOrders(orderList);
        setPagination(data.pagination || {
          page: 1,
          limit: ORDERS_PER_PAGE,
          total: orderList.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setOrders([]);
      setOrdersNeedingConfirmationList([]);
      setPagination((p) => ({ ...p, total: 0, totalPages: 1, hasNext: false, hasPrev: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(selectedStatus, 1);
  }, [loadOrders, selectedStatus]);

  useEffect(() => {
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    if (confirmModalOrder) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [confirmModalOrder]);

  const refreshList = useCallback(() => {
    const page = selectedStatus === FILTER_NEEDS_CONFIRMATION ? 1 : pagination.page;
    loadOrders(selectedStatus, page);
  }, [selectedStatus, pagination.page, loadOrders]);

  const goToCheckout = () => {
    if (!confirmModalOrder?.id) return;
    const orderId = confirmModalOrder.id;
    setConfirmModalOrder(null);
    navigate(`/orders/${orderId}/checkout`);
  };

  const handleCancelOrderFromModal = async () => {
    if (!confirmModalOrder?.id) return;
    try {
      setActionLoading(true);
      await cancelOrder(confirmModalOrder.id, {});
      setConfirmModalOrder(null);
      showToast('Pedido cancelado.', 'info');
      refreshList();
    } catch (err) {
      showToast(
        err.response?.data?.error || 'No se pudo cancelar. Intenta de nuevo.',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    loadOrders(status, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    if (selectedStatus === FILTER_NEEDS_CONFIRMATION) {
      const start = (newPage - 1) * ORDERS_PER_PAGE;
      setOrders(ordersNeedingConfirmationList.slice(start, start + ORDERS_PER_PAGE));
      const total = ordersNeedingConfirmationList.length;
      const totalPages = Math.max(1, Math.ceil(total / ORDERS_PER_PAGE));
      setPagination({
        page: newPage,
        limit: ORDERS_PER_PAGE,
        total,
        totalPages,
        hasNext: newPage < totalPages,
        hasPrev: newPage > 1,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      loadOrders(selectedStatus, newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const needsConfirmationCount = ordersNeedingConfirmationList.length;
  const showNeedsConfirmationBadge =
    selectedStatus === FILTER_NEEDS_CONFIRMATION && needsConfirmationCount > 0 && !loading;
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);
  const showPagination = totalPages > 1 && total > 0;

  const getEmptyTitle = () => {
    if (selectedStatus === FILTER_NEEDS_CONFIRMATION) return 'Nada pendiente de confirmar';
    return 'Aún no tienes pedidos';
  };
  const getEmptyMessage = () => {
    if (selectedStatus === FILTER_NEEDS_CONFIRMATION) {
      return 'No tienes pedidos pendientes de confirmar. Revisa el detalle de tus pedidos en "Todos".';
    }
    if (selectedStatus) {
      return `No hay pedidos con estado "${STATUS_LABELS[selectedStatus]}". Prueba otro filtro.`;
    }
    return 'Cuando hagas una compra, aparecerá aquí con su estado y detalle.';
  };

  return (
    <div className="orders-page orders-page--compact">
      <header className="orders-header">
        <h1 className="orders-header-title">Mis Pedidos</h1>
        {showNeedsConfirmationBadge && (
          <div className="orders-header-badge" role="status">
            <span className="orders-header-badge-dot" aria-hidden="true" />
            {needsConfirmationCount}{' '}
            {needsConfirmationCount === 1 ? 'pedido requiere tu confirmación' : 'pedidos requieren tu confirmación'}
          </div>
        )}
      </header>

      <nav className="orders-filters" aria-label="Filtrar pedidos">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`orders-filter-btn ${selectedStatus === option.value ? 'active' : ''}`}
            onClick={() => handleStatusFilter(option.value)}
            disabled={loading}
            aria-pressed={selectedStatus === option.value}
            aria-label={option.value ? option.label : 'Ver todos los pedidos'}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {/* Contenido variable: loading, lista vacía o lista de pedidos */}
      {loading ? (
        <div className="orders-loading orders-loading-inline">
          <div className="orders-loading-spinner" aria-hidden="true" />
          <p>Cargando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <section className="orders-empty" aria-label="Sin pedidos">
          <div className="orders-empty-box">
            <div className="orders-empty-icon" aria-hidden="true" />
            <h2 className="orders-empty-title">{getEmptyTitle()}</h2>
            <p className="orders-empty-text">{getEmptyMessage()}</p>
            <Link to="/products" className="orders-empty-cta">
              Ver productos
            </Link>
          </div>
        </section>
      ) : (
        <section className="orders-list orders-list--compact" aria-label="Lista de pedidos">
          {orders.map((item) => {
            const availability = getOrderDeliveryDisplay(item.deliveryType) ?? getOrderAvailabilityFromNotes(item.notes);
            return (
              <article
                key={item.id}
                className="orders-order-card orders-order-card--compact"
              >
                <Link to={`/orders/${item.id}`} className="orders-order-card-link">
                  {/* Barra superior: fecha + folio | estado */}
                  <div className="orders-order-top">
                    <div className="orders-order-meta">
                      <span className="orders-order-folio">Pedido #{item.id}</span>
                      <span className="orders-order-date">
                        Generado: {formatShortDateTime(item.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`orders-order-status ${CAN_ACCEPT_OR_CANCEL.includes(item.status) ? 'orders-order-status--confirm' : ''}`}
                      style={{
                        backgroundColor: CAN_ACCEPT_OR_CANCEL.includes(item.status)
                          ? '#e3f2fd'
                          : `${STATUS_COLORS[item.status] || '#95a5a6'}20`,
                        color: CAN_ACCEPT_OR_CANCEL.includes(item.status)
                          ? '#1565c0'
                          : (STATUS_COLORS[item.status] || '#95a5a6'),
                      }}
                    >
                      {CAN_ACCEPT_OR_CANCEL.includes(item.status) ? 'Confirmar pedido' : (STATUS_LABELS[item.status] ?? item.status)}
                    </span>
                  </div>

                  {/* Disponibilidad listo para recoger (solo si aplica) */}
                  {item.status === ORDER_STATUS.READY_FOR_PICKUP && (() => {
                    const readyMsg = getReadyAtAvailabilityMessage(item.readyAt);
                    if (!readyMsg.shortMessage) return null;
                    return (
                      <p className="orders-order-ready-at" role="status">
                        {readyMsg.shortMessage}
                      </p>
                    );
                  })()}

                  {/* Disponibilidad en camino (solo si aplica) */}
                  {item.status === ORDER_STATUS.IN_TRANSIT && (() => {
                    const readyMsg = "En breve llegará a tu domicilio"; 
                    return (
                      <p className="orders-order-ready-at" role="status">
                        {readyMsg}
                      </p>
                    );
                  })()}

                  {/* Fecha entregado (solo si aplica) */}
                  {item.status === ORDER_STATUS.COMPLETED && item.deliveredAt && (
                    <p className="orders-order-delivered-at" role="status">
                      Entregado el {formatShortDateTime(item.deliveredAt)}
                    </p>
                  )}

                  {/* Tipo de entrega: pill discreto (icono + texto corto) */}
                  {availability && (
                    <span
                      className={`orders-order-delivery-pill orders-order-delivery-pill--${availability.type}`}
                      title={availability.label}
                      role="status"
                    >
                      <span className="orders-order-delivery-pill-icon" aria-hidden="true">
                        {availability.icon}
                      </span>
                      <span className="orders-order-delivery-pill-text">
                        {availability.shortLabel ?? availability.label}
                      </span>
                    </span>
                  )}

                  {/* Resumen */}
                  <div className="orders-order-body">
                    <div className="orders-order-summary">
                      {STATUS_LIST_MESSAGE[item.status] ? (
                        <span className="orders-order-status-message">
                          {STATUS_LIST_MESSAGE[item.status]}
                        </span>
                      ) : (
                        <>
                          <span className="orders-order-products">
                            {item.items?.length || 0}{' '}
                            {item.items?.length === 1 ? 'producto' : 'productos'}
                          </span>
                          {item.branch && (
                            <>
                              <span className="orders-order-sep">·</span>
                              <span className="orders-order-branch">{item.branch.name}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="orders-order-total">{formatPrice(item.total)}</div>
                  </div>

                  {/* CTA: botón Confirmar (solo disponible/parcial) o solo Ver detalle */}
                  <div className="orders-order-footer">
                    {CAN_ACCEPT_OR_CANCEL.includes(item.status) ? (
                      <button
                        type="button"
                        className="orders-order-btn-confirm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmModalOrder(item);
                        }}
                        aria-label="Abrir opciones de confirmación del pedido"
                      >
                        Confirmar pedido
                      </button>
                    ) : null}
                    <span className="orders-order-cta">
                      {CAN_ACCEPT_OR_CANCEL.includes(item.status) ? 'Ver detalle' : 'Ver detalle del pedido'}
                    </span>
                    <span className="orders-order-cta-arrow" aria-hidden="true">→</span>
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
      )}

      {!loading && showPagination && (
        <nav className="orders-pagination" aria-label="Paginación de pedidos">
          <div className="orders-pagination-summary">
            Mostrando <strong>{from}</strong>-<strong>{to}</strong> de <strong>{total}</strong>{' '}
            {total === 1 ? 'pedido' : 'pedidos'}
          </div>
          <div className="orders-pagination-controls">
            <button
              type="button"
              className="orders-pagination-btn orders-pagination-prev"
              onClick={() => handlePageChange(page - 1)}
              disabled={!hasPrev}
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <div className="orders-pagination-numbers">
              {pageNumbers.map((num, idx) =>
                num === 'ellipsis' ? (
                  <span key={`ellipsis-${page}-${idx}`} className="orders-pagination-ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    key={num}
                    type="button"
                    className={`orders-pagination-num ${num === page ? 'orders-pagination-num--current' : ''}`}
                    onClick={() => handlePageChange(num)}
                    aria-label={`Página ${num}`}
                    aria-current={num === page ? 'page' : undefined}
                  >
                    {num}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="orders-pagination-btn orders-pagination-next"
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNext}
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
          </div>
        </nav>
      )}

      <dialog
        ref={confirmDialogRef}
        className="orders-confirm-dialog"
        aria-labelledby="orders-confirm-dialog-title"
        aria-modal="true"
        onClose={() => !actionLoading && setConfirmModalOrder(null)}
        onCancel={() => !actionLoading && setConfirmModalOrder(null)}
      >
        <div className="orders-confirm-dialog-content">
          <h2 id="orders-confirm-dialog-title" className="orders-confirm-dialog-title">
            Confirmar pedido
          </h2>
          {confirmModalOrder && (
            <>
              <p className="orders-confirm-dialog-message">
                {confirmModalOrder.status === ORDER_STATUS.AVAILABLE
                  ? 'Todos los productos de tu pedido están disponibles. Confírmalo para que lo preparemos.'
                  : 'Revisa la disponibilidad de cada producto. Puedes confirmar con el total actual o cancelar el pedido.'}
              </p>
              {confirmModalOrder.items?.length > 0 && (
                <div className="orders-confirm-dialog-products">
                  <p className="orders-confirm-dialog-products-title">Productos en tu pedido</p>
                  <ul className="orders-confirm-dialog-products-scroll" aria-label="Lista de productos del pedido">
                    {confirmModalOrder.items.map((item) => {
                      const { statusClass, statusLabel, statusIcon } = getItemAvailabilityDisplay(item);
                      return (
                        <li
                          key={item.id}
                          className={`orders-confirm-dialog-product ${statusClass}`}
                        >
                          <span className="orders-confirm-dialog-product-icon" aria-hidden="true">
                            {statusIcon}
                          </span>
                          <div className="orders-confirm-dialog-product-body">
                            <span className="orders-confirm-dialog-product-name">
                              {item.productName ?? 'Producto'}
                            </span>
                            {item.presentationName && (
                              <span className="orders-confirm-dialog-product-presentation">
                                {item.presentationName}
                              </span>
                            )}
                            <span className="orders-confirm-dialog-product-qty">
                              {item.quantity} × {formatPrice(item.unitPrice)}
                            </span>
                          </div>
                          <span className={`orders-confirm-dialog-product-badge ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className="orders-confirm-dialog-total">
                Total: <strong>{formatPrice(confirmModalOrder.total)}</strong>
              </p>
            </>
          )}
          <div className="orders-confirm-dialog-actions">
            <button
              type="button"
              className="orders-confirm-dialog-btn orders-confirm-dialog-btn--secondary"
              onClick={handleCancelOrderFromModal}
              disabled={actionLoading}
              aria-label="Cancelar este pedido"
            >
              Cancelar pedido
            </button>
            <button
              type="button"
              className="orders-confirm-dialog-btn orders-confirm-dialog-btn--primary"
              onClick={goToCheckout}
              disabled={actionLoading}
              aria-label="Continuar a finalizar pedido"
            >
              Continuar
            </button>
          </div>
          <button
            type="button"
            className="orders-confirm-dialog-close"
            onClick={() => !actionLoading && setConfirmModalOrder(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
