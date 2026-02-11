import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCashExpressRequests } from '../services/cashExpressService';
import { STATUS_COLORS, STATUS_LABELS, STATUS_ICONS } from '../constants/cashExpress';
import './CashExpressRequests.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Mensaje corto por estado para la card (solo lo necesario)
const getStatusHint = (request) => {
  switch (request.status) {
    case 'PENDIENTE':
      return 'Deposita, sube comprobante y completa datos del destinatario.';
    case 'EN_ESPERA_CONFIRMACION':
      return 'Tu comprobante está en revisión. Te avisaremos cuando esté validado.';
    case 'REBOTADO':
      return 'Rechazado. Revisa el detalle y vuelve a enviar.';
    case 'DEPOSITO_VALIDADO':
      return 'Tu solicitud ha sido validada.';
    case 'ENTREGADO':
      return 'Entregado.';
    case 'CANCELADO':
      return 'Solicitud cancelada.';
    default:
      return '';
  }
};

export default function CashExpressRequests() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('EN_PROCESO');

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadRequests();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsData = await getCashExpressRequests();
      const allRequests = Array.isArray(requestsData) ? requestsData : [];
      const sorted = [...allRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(sorted);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredRequests = () => {
    if (statusFilter === 'EN_PROCESO') {
      return requests.filter(
        (req) => req.status !== 'ENTREGADO' && req.status !== 'CANCELADO'
      );
    }
    if (statusFilter === 'TODAS') return requests;
    return requests.filter((req) => req.status === statusFilter);
  };

  const filteredRequests = getFilteredRequests();
  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  if (authLoading || loading) {
    return (
      <div className="requests-loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="requests-container">
        <div className="auth-required">
          <div className="auth-icon">🔒</div>
          <h2>Inicio de sesión requerido</h2>
          <p>Necesitas iniciar sesión para ver tus solicitudes</p>
          <Link to="/login" className="login-button">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="requests-container">
      <div className="requests-header">
        <h1>Mis Solicitudes</h1>
        <button
          type="button"
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      <div className="filters-container">
        <button
          type="button"
          className={`filter-button ${statusFilter === 'EN_PROCESO' ? 'active' : ''}`}
          onClick={() => setStatusFilter('EN_PROCESO')}
        >
          En proceso
        </button>
        <button
          type="button"
          className={`filter-button ${statusFilter === 'TODAS' ? 'active' : ''}`}
          onClick={() => setStatusFilter('TODAS')}
        >
          Todas
        </button>
        <button
          type="button"
          className={`filter-button ${statusFilter === 'PENDIENTE' ? 'active' : ''}`}
          onClick={() => setStatusFilter('PENDIENTE')}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={`filter-button ${statusFilter === 'DEPOSITO_VALIDADO' ? 'active' : ''}`}
          onClick={() => setStatusFilter('DEPOSITO_VALIDADO')}
        >
          Validadas
        </button>
        <button
          type="button"
          className={`filter-button ${statusFilter === 'ENTREGADO' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ENTREGADO')}
        >
          Entregadas
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-requests">
          <div className="empty-icon">⚡</div>
          <h2>
            {requests.length === 0
              ? 'No tienes solicitudes aún'
              : 'No hay solicitudes con este filtro'}
          </h2>
          <p>
            {requests.length === 0
              ? 'Tus solicitudes de Efectivo Express aparecerán aquí'
              : 'Cambia el filtro para ver más'}
          </p>
          {requests.length === 0 && (
            <Link to="/cash-express" className="create-button">
              Crear solicitud
            </Link>
          )}
        </div>
      ) : (
        <div className="requests-list requests-list-compact">
          {filteredRequests.map((request) => {
            const hint = getStatusHint(request);
            const isDelivered = request.status === 'ENTREGADO';
            const isCanceled = request.status === 'CANCELADO';
            const showFolio =
              (request.status === 'DEPOSITO_VALIDADO' || request.status === 'ENTREGADO') &&
              request.folio;

            return (
              <Link
                key={request.id}
                to={`/cash-express/requests/${request.id}`}
                className={`request-card request-card-compact ${
                  isDelivered ? 'card-delivered' : ''
                } ${isCanceled ? 'card-canceled' : ''}`}
              >
                <div className="card-compact-top">
                  <div
                    className="card-status-badge"
                    style={{
                      backgroundColor: `${STATUS_COLORS[request.status] || '#999'}18`,
                      color: STATUS_COLORS[request.status] || '#333',
                    }}
                  >
                    <span className="card-status-icon">{STATUS_ICONS[request.status]}</span>
                    <span>{STATUS_LABELS[request.status]}</span>
                  </div>
                  <span className="card-date">{formatDate(request.createdAt)}</span>
                </div>

                <div className="card-compact-body">
                  <div className="card-amounts">
                    <div className="card-amount-item">
                      <span className="card-amount-label">Monto</span>
                      <span className="card-amount-value">{formatPrice(request.amount)}</span>
                    </div>
                    <div className="card-amount-item">
                      <span className="card-amount-label">Total a depositar</span>
                      <span className="card-amount-value">{formatPrice(request.totalToDeposit)}</span>
                    </div>
                  </div>
                  {hint && <p className="card-hint">{hint}</p>}
                  {showFolio && (
                    <div className="card-folio-mini">
                      <span className="card-folio-label">Clave de retiro:</span>
                      <span className="card-folio-value">{request.folio}</span>
                    </div>
                  )}
                </div>

                <div className="card-compact-footer">
                  <span className="card-cta">
                    {request.status === 'ENTREGADO' ? 'Ver detalle' : request.status === 'DEPOSITO_VALIDADO' ? 'Ver instrucciones para retirar' : 'Dar seguimiento'}
                  </span>
                  <span className="card-arrow">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
