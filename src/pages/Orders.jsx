import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/ordersService';
import {
  ORDER_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_OPTIONS_FILTER,
  STATUS_LIST_MESSAGE,
} from '../constants/orderStatus';
import { getOrderAvailabilityFromNotes } from '../utils/orderAvailability';
import './Orders.css';

const STATUS_OPTIONS = STATUS_OPTIONS_FILTER;

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

const ORDERS_PER_PAGE = 3;

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

export default function Orders() {
  const [orders, setOrders] = useState([]);
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
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const filterDialogRef = useRef(null);

  const loadOrders = useCallback(async (status, page = 1) => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      setOrders([]);
      setPagination((p) => ({ ...p, total: 0, totalPages: 1, hasNext: false, hasPrev: false }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(selectedStatus, 1);
  }, [loadOrders, selectedStatus]);

  useEffect(() => {
    const dialog = filterDialogRef.current;
    if (!dialog) return;
    if (showStatusFilter) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [showStatusFilter]);

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    setShowStatusFilter(false);
    loadOrders(status, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    loadOrders(selectedStatus, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingCount = orders.filter(
    (o) => o.status === 'UNDER_REVIEW' || o.status === 'PARTIALLY_AVAILABLE' || o.status === 'AVAILABLE'
  ).length;
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pageNumbers = getPageNumbers(page, totalPages);
  const showPagination = totalPages > 1 && total > 0;

  return (
    <div className="orders-page">
      {/* Hero / Encabezado: siempre visible */}
      <header className="orders-hero">
        <h1 className="orders-hero-title">Mis Pedidos</h1>
        <p className="orders-hero-subtitle">
          Revisa el estado de tus compras y el detalle de cada pedido
        </p>
        {pendingCount > 0 && !loading && (
          <div className="orders-hero-badge">
            <span className="orders-hero-badge-dot" aria-hidden="true" />
            {pendingCount} {pendingCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
          </div>
        )}
      </header>

      {/* Filtros por estado: siempre visibles */}
      <nav className="orders-filters-wrap" aria-label="Filtrar pedidos por estado">
        <div className="orders-filters-scroll">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`orders-chip ${selectedStatus === option.value ? 'orders-chip--active' : ''} ${option.value === '' ? 'orders-chip--all' : ''}`}
              onClick={() => handleStatusFilter(option.value)}
              disabled={loading}
              aria-pressed={selectedStatus === option.value}
              aria-label={option.value ? `Ver pedidos: ${option.label}` : 'Ver todos los pedidos'}
            >
              {option.label}
            </button>
          ))}
        </div>
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
            <h2 className="orders-empty-title">Aún no tienes pedidos</h2>
            <p className="orders-empty-text">
              {selectedStatus
                ? `No hay pedidos con estado "${STATUS_LABELS[selectedStatus]}". Prueba otro filtro.`
                : 'Cuando hagas una compra, aparecerá aquí con su estado y detalle.'}
            </p>
            <Link to="/products" className="orders-empty-cta">
              Ver productos
            </Link>
          </div>
        </section>
      ) : (
        <section className="orders-list" aria-label="Lista de pedidos">
          {orders.map((item) => {
            const availability = getOrderAvailabilityFromNotes(item.notes);
            return (
              <article
                key={item.id}
                className="orders-order-card"
              >
                <Link to={`/orders/${item.id}`} className="orders-order-card-link">
                  {/* Barra superior: fecha + folio | estado */}
                  <div className="orders-order-top">
                    <div className="orders-order-meta">
                      <span className="orders-order-date">
                        {formatShortDate(item.createdAt)}
                      </span>
                      {item.folio && (
                        <span className="orders-order-folio">Pedido {item.folio}</span>
                      )}
                    </div>
                    <span
                      className="orders-order-status"
                      style={{
                        backgroundColor: `${STATUS_COLORS[item.status] || '#95a5a6'}20`,
                        color: STATUS_COLORS[item.status] || '#95a5a6',
                      }}
                    >
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>

                  {/* Fecha listo para recoger (solo si aplica) */}
                  {item.status === ORDER_STATUS.READY_FOR_PICKUP && item.readyAt && (
                    <p className="orders-order-ready-at" role="status">
                      Listo desde {formatShortDateTime(item.readyAt)}
                    </p>
                  )}

                  {/* Fecha en camino (solo si aplica) */}
                  {item.status === ORDER_STATUS.IN_TRANSIT && item.readyAt && (
                    <p className="orders-order-ready-at" role="status">
                      En camino desde {formatShortDateTime(item.readyAt)}
                    </p>
                  )}

                  {/* Fecha entregado (solo si aplica) */}
                  {item.status === ORDER_STATUS.COMPLETED && item.deliveredAt && (
                    <p className="orders-order-delivered-at" role="status">
                      Entregado el {formatShortDateTime(item.deliveredAt)}
                    </p>
                  )}

                  {/* Flag tipo de entrega (productAvailability) */}
                  {availability && (
                    <div className={`orders-order-flag orders-order-flag--${availability.type}`} role="status">
                      <span className="orders-order-flag-icon" aria-hidden>{availability.icon}</span>
                      <div className="orders-order-flag-text">
                        <span className="orders-order-flag-label">{availability.label}</span>
                        <span className="orders-order-flag-subtitle">{availability.subtitle}</span>
                      </div>
                    </div>
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

                  {/* CTA */}
                  <div className="orders-order-footer">
                    <span className="orders-order-cta">Ver detalle del pedido</span>
                    <span className="orders-order-cta-arrow" aria-hidden="true">→</span>
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
      )}

      {/* Paginación: solo cuando hay resultados y no está cargando */}
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

      {/* Modal filtros (móvil) */}
      <dialog
        ref={filterDialogRef}
        className="orders-modal-dialog"
        aria-labelledby="orders-modal-title"
        onClose={() => setShowStatusFilter(false)}
        onCancel={() => setShowStatusFilter(false)}
      >
        <div className="orders-modal-content">
          <div className="orders-modal-header">
            <h3 id="orders-modal-title" className="orders-modal-title">Estado del pedido</h3>
            <button
              type="button"
              className="orders-modal-close"
              onClick={() => setShowStatusFilter(false)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <div className="orders-modal-body">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`orders-status-option ${selectedStatus === option.value ? 'active' : ''}`}
                onClick={() => handleStatusFilter(option.value)}
              >
                {option.label}
                {selectedStatus === option.value && <span className="orders-status-option-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}
