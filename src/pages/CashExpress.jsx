import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  createCashExpressRequest,
  getCashExpressConfig,
  getBankAccounts,
  getSuggestedAvailability,
  getCashExpressRequests,
} from '../services/cashExpressService';
import { Toast } from '../components/Toast';
import './CashExpress.css';

const STATUS_EN_PROCESO = new Set(['PENDIENTE', 'EN_ESPERA_CONFIRMACION', 'DEPOSITO_VALIDADO']);

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatEstimatedDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export default function CashExpress() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { logCashExpressRequest } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [config, setConfig] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [suggestedAvailability, setSuggestedAvailability] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [requestsInProcess, setRequestsInProcess] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  useEffect(() => {
    loadConfig();
    loadBankAccounts();
    
    // Recuperar datos pendientes si el usuario volvió después de login
    const pendingData = sessionStorage.getItem('cashExpressPending');
    if (pendingData && isAuthenticated) {
      try {
        const data = JSON.parse(pendingData);
        setAmount(data.amount.toString());
        // Mostrar mensaje informativo
        setTimeout(() => {
          setToast({ open: true, message: 'Bienvenido de vuelta. Tu solicitud está lista para ser creada.', type: 'info' });
        }, 500);
      } catch (error) {
        console.error('Error recuperando datos pendientes:', error);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRequestsCount();
    }
  }, [isAuthenticated]);

  const loadRequestsCount = async () => {
    try {
      setLoadingRequests(true);
      const data = await getCashExpressRequests();
      const list = Array.isArray(data) ? data : data?.requests || [];
      const inProcess = list.filter((r) => r.status && STATUS_EN_PROCESO.has(r.status)).length;
      setRequestsInProcess(inProcess);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // No volver a pedir fecha estimada después de crear: la fecha correcta es la que
  // el backend calculó al crear (con saldo disponible antes de apartar esta solicitud).
  // Si se pide después, el backend ya apartó el monto y devuelve una fecha más lejana.

  const loadConfig = async () => {
    try {
      const data = await getCashExpressConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
      // Si es error 401, el endpoint aún requiere auth (backend no actualizado)
      // Si es otro error, usar valores por defecto
      if (error.response?.status === 401) {
        console.warn('El endpoint aún requiere autenticación. Usando valores por defecto.');
      }
      // Valores por defecto
      setConfig({
        id: 0,
        serviceDays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '20:00',
        holidays: [],
        nonWorkingDayMessage: 'Tu solicitud será procesada el próximo día hábil.',
        availableBalance: 0,
        dailyMinimumDeposit: 500,
        maxAmount: 1000,
        commissionPercentage: 6.5,
      });
    }
  };

  const loadBankAccounts = async () => {
    try {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error cargando cuentas bancarias:', error);
    }
  };

  const loadSuggestedAvailability = async () => {
    try {
      setLoadingSuggestion(true);
      const suggestion = await getSuggestedAvailability(createdRequest.amount);
      setSuggestedAvailability(suggestion);
    } catch (error) {
      console.error('Error cargando fecha estimada:', error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  // Función mejorada para verificar disponibilidad del servicio
  const isServiceAvailable = () => {
    if (!config) {
      return {
        available: true,
        message: '',
        nextAvailableDate: null,
        nextAvailableTime: null,
        reason: null,
      };
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 6 = Sábado
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const todayDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Verificar si es día festivo
    if (config.holidays.includes(todayDate)) {
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + 1);
      let daysToAdd = 1;
      while (daysToAdd <= 14) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + daysToAdd);
        const checkDay = checkDate.getDay();
        const checkDateStr = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}-${checkDate.getDate().toString().padStart(2, '0')}`;
        
        if (config.serviceDays.includes(checkDay) && !config.holidays.includes(checkDateStr)) {
          return {
            available: false,
            message: `El servicio no está disponible hoy por ser día festivo.`,
            nextAvailableDate: checkDate,
            nextAvailableTime: config.startTime,
            reason: 'holiday',
            formattedNextDate: formatNextAvailableDate(checkDate, config.startTime),
          };
        }
        daysToAdd++;
      }
      return {
        available: false,
        message: config.nonWorkingDayMessage || 'El servicio no está disponible hoy por ser día festivo.',
        nextAvailableDate: null,
        nextAvailableTime: null,
        reason: 'holiday',
      };
    }

    // Verificar si es día de servicio
    if (!config.serviceDays.includes(currentDay)) {
      let daysToAdd = 1;
      while (daysToAdd <= 7) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysToAdd);
        const nextDay = nextDate.getDay();
        const nextDateStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;
        
        if (config.serviceDays.includes(nextDay) && !config.holidays.includes(nextDateStr)) {
          return {
            available: false,
            message: `El servicio no está disponible los ${dayNames[currentDay] === 'Domingo' || dayNames[currentDay] === 'Sábado' ? 'fines de semana' : 'días no hábiles'}.`,
            nextAvailableDate: nextDate,
            nextAvailableTime: config.startTime,
            reason: 'day',
            formattedNextDate: formatNextAvailableDate(nextDate, config.startTime),
          };
        }
        daysToAdd++;
      }
      return {
        available: false,
        message: config.nonWorkingDayMessage || 'Tu solicitud será procesada el próximo día hábil.',
        nextAvailableDate: null,
        nextAvailableTime: null,
        reason: 'day',
      };
    }

    // Verificar horario de servicio
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = currentHour * 60 + currentMinute;

    if (currentMinutes < startMinutes) {
      // Aún no ha comenzado el servicio hoy
      const nextDate = new Date(now);
      return {
        available: false,
        message: `El servicio aún no ha comenzado hoy.`,
        nextAvailableDate: nextDate,
        nextAvailableTime: config.startTime,
        reason: 'time',
        formattedNextDate: `Hoy a las ${config.startTime}`,
      };
    }

    if (currentMinutes >= endMinutes) {
      // El servicio ya cerró hoy, buscar próximo día
      let daysToAdd = 1;
      while (daysToAdd <= 7) {
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysToAdd);
        const nextDay = nextDate.getDay();
        const nextDateStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;
        
        if (config.serviceDays.includes(nextDay) && !config.holidays.includes(nextDateStr)) {
          return {
            available: false,
            message: `El horario de servicio de hoy ya terminó.`,
            nextAvailableDate: nextDate,
            nextAvailableTime: config.startTime,
            reason: 'time',
            formattedNextDate: formatNextAvailableDate(nextDate, config.startTime),
          };
        }
        daysToAdd++;
      }
    }

    // Servicio disponible
    return {
      available: true,
      message: '',
      nextAvailableDate: null,
      nextAvailableTime: null,
      reason: null,
    };
  };

  // Función auxiliar para formatear la próxima fecha disponible
  const formatNextAvailableDate = (date, time) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    if (diffDays === 0) {
      return `Hoy a las ${time}`;
    } else if (diffDays === 1) {
      return `Mañana (${dayNames[date.getDay()]}) a las ${time}`;
    } else if (diffDays <= 7) {
      return `${dayNames[date.getDay()]} ${date.getDate()} de ${monthNames[date.getMonth()]} a las ${time}`;
    } else {
      return `${dayNames[date.getDay()]} ${date.getDate()} de ${monthNames[date.getMonth()]} a las ${time}`;
    }
  };

  // Función para obtener los días de servicio formateados
  const getServiceDaysFormatted = () => {
    if (!config) return '';
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    if (config.serviceDays.length === 7) {
      return 'Todos los días';
    } else if (config.serviceDays.length === 5 && 
               config.serviceDays.includes(1) && 
               config.serviceDays.includes(2) && 
               config.serviceDays.includes(3) && 
               config.serviceDays.includes(4) && 
               config.serviceDays.includes(5)) {
      return 'Lunes a Viernes';
    } else {
      return config.serviceDays
        .sort((a, b) => a - b)
        .map(day => dayNamesShort[day])
        .join(', ');
    }
  };

  const handleAmountChange = (e) => {
    const text = e.target.value;
    // Solo permitir números enteros (sin decimales)
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const amountNum = parseFloat(amount) || 0;
  const maxAmount = config?.maxAmount || 1000;
  const commissionPercentage = config?.commissionPercentage || 6.5;
  
  // Calcular comisión
  const commission = amountNum > 0 ? (amountNum * commissionPercentage) / 100 : 0;
  
  // Calcular total con decimales
  const totalWithDecimals = amountNum + commission;
  
  // Redondear el total hacia arriba al siguiente peso entero (para depósitos en efectivo)
  const totalToDeposit = Math.ceil(totalWithDecimals);
  
  const isValidAmount = amountNum > 0 && amountNum <= maxAmount && Number.isInteger(amountNum);
  const isFormValid = isValidAmount;

  const handleSubmit = async () => {
    if (!isFormValid) {
      setToast({ open: true, message: 'Por favor ingresa un monto válido.', type: 'error' });
      return;
    }

    const availability = isServiceAvailable();
    if (!availability.available) {
      const alertMessage = availability.formattedNextDate
        ? `${availability.message}\n\nPróxima disponibilidad: ${availability.formattedNextDate}`
        : availability.message;
      setToast({ open: true, message: alertMessage, type: 'info' });
      return;
    }

    // Verificar autenticación solo cuando intente crear la solicitud
    if (!isAuthenticated) {
      const shouldLogin = window.confirm(
        'Para crear una solicitud necesitas iniciar sesión.\n\n¿Deseas iniciar sesión o crear una cuenta?'
      );
      if (shouldLogin) {
        // Guardar los datos del formulario en sessionStorage para recuperarlos después
        sessionStorage.setItem('cashExpressPending', JSON.stringify({
          amount: amountNum,
          commission,
          totalToDeposit,
        }));
        navigate('/login', { state: { returnTo: '/cash-express', message: 'Inicia sesión para crear tu solicitud de Efectivo Express' } });
      }
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = async () => {
    setShowConfirmModal(false);

    try {
      setLoading(true);
      const response = await createCashExpressRequest({
        amount: amountNum,
      });
      
      setCreatedRequest(response.request || response);
      setShowBankAccounts(true);
      setAmount('');
      sessionStorage.removeItem('cashExpressPending');
      loadRequestsCount();
      logCashExpressRequest(amountNum);
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.error || 'No se pudo crear la solicitud. Intenta nuevamente.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <div className="cash-express-container">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
      <div className="cash-express-header">
        <h1>⚡ Efectivo Express</h1>
      </div>

      <div className="cash-express-content">
        {isAuthenticated && (
          <div className="ce-requests-banner-wrap">
            {loadingRequests ? (
              <div className="ce-requests-banner ce-requests-banner-loading">
                <span className="ce-requests-banner-spinner" />
                <span>Cargando tus solicitudes...</span>
              </div>
            ) : requestsInProcess > 0 ? (
              <Link to="/cash-express/requests" className="ce-requests-banner ce-requests-banner-active">
                <span className="ce-requests-banner-icon">📋</span>
                <div className="ce-requests-banner-text">
                  <strong>
                    {requestsInProcess === 1
                      ? 'Tienes 1 solicitud en proceso'
                      : `Tienes ${requestsInProcess} solicitudes en proceso`}
                  </strong>
                  <span className="ce-requests-banner-sub">Revisa el estado y completa los pasos pendientes</span>
                </div>
                <span className="ce-requests-banner-cta">Ver Mis Solicitudes →</span>
              </Link>
            ) : null}
          </div>
        )}

        <button
          className="how-it-works-button"
          onClick={() => setShowHowItWorks(true)}
        >
          <span>ℹ️</span>
          <span>¿Cómo funciona?</span>
          <span>→</span>
        </button>

        {/* Información de Horarios y Disponibilidad - Solo mostrar si NO está disponible */}
        {config && (() => {
          const availability = isServiceAvailable();
          if (!availability.available) {
            return (
              <div className="service-info-card">
                <div className="service-info-header">
                  <span className="service-info-icon">🕐</span>
                  <div className="service-info-content">
                    <h3 className="service-info-title">Horarios de Servicio</h3>
                    <p className="service-info-subtitle">
                      {getServiceDaysFormatted()} de {config.startTime} a {config.endTime}
                    </p>
                  </div>
                </div>
                <div className="service-unavailable-notice">
                  <span className="notice-icon">⏰</span>
                  <div className="notice-content">
                    <p className="notice-message">{availability.message}</p>
                    {availability.formattedNextDate && (
                      <p className="notice-next-date">
                        Próxima disponibilidad: <strong>{availability.formattedNextDate}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        <div className="section">
          <h2 className="section-title">💰Ingresa el Monto a Enviar</h2>
          <p className="section-subtitle">
            Máximo: {formatPrice(maxAmount)} | Comisión: {commissionPercentage}%
          </p>

          <div className="amount-container">
            <div className="amount-input-container">
              <span className="currency-symbol">$</span>
              <input
                type="text"
                className={`amount-input ${!isValidAmount && amount !== '' ? 'error' : ''}`}
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            {amountNum > maxAmount && (
              <p className="error-text">
                El monto máximo es {formatPrice(maxAmount)}
              </p>
            )}
            {amountNum > 0 && !Number.isInteger(amountNum) && (
              <p className="error-text">
                ⚠️ Solo se aceptan montos enteros (sin centavos) para depósitos en efectivo
              </p>
            )}
            {amountNum > 0 && amountNum <= maxAmount && (
              <p className="info-text-small">
                💡 Ingresa solo números enteros.
              </p>
            )}
          </div>

          {/*<div className="quick-amounts">
            <p className="quick-amount-label">Cantidades rápidas:</p>
            <div className="quick-amount-buttons">
              {[500, 750, 1000].map((value) => (
                <button
                  key={value}
                  className={`quick-amount-button ${
                    amountNum === value ? 'active' : ''
                  }`}
                  onClick={() => handleQuickAmount(value)}
                >
                  {formatPrice(value)}
                </button>
              ))}
            </div>
          </div>*/}

          {isValidAmount && (
            <div className="summary-card">
              <div className="summary-row">
                <span className="summary-label">Monto a enviar:</span>
                <span className="summary-value">{formatPrice(amountNum)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Comisión ({commissionPercentage}%):</span>
                <span className="summary-value">
                  {formatPrice(commission)}
                </span>
              </div>
              {totalToDeposit !== totalWithDecimals && (
                <div className="summary-row adjustment">
                  <span className="summary-label">Ajuste (redondeo):</span>
                  <span className="summary-value adjustment-value">
                    +{formatPrice(totalToDeposit - totalWithDecimals)}
                  </span>
                </div>
              )}
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span className="summary-total-label">Total a depositar:</span>
                <span className="summary-total-value">
                  {formatPrice(totalToDeposit)}
                </span>
              </div>
              {totalToDeposit !== totalWithDecimals && (
                <p className="rounding-note">
                  💰 El total se redondeó hacia arriba para facilitar el depósito en efectivo
                </p>
              )}
            </div>
          )}
        </div>

        <div className="info-card">
          <span>ℹ️</span>
          <p>
            Los datos de las cuentas a depositar y destinatario se solicitarán después de crear la solicitud.
          </p>
        </div>

        {!isAuthenticated && (
          <div className="auth-reminder">
            <p>💡 <strong>Nota:</strong> Necesitarás iniciar sesión o crear una cuenta para crear la solicitud.</p>
            <div className="auth-buttons">
              <Link
                to="/login"
                state={{ returnTo: '/cash-express', message: '' }}
                className="auth-link-button"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                state={{ returnTo: '/cash-express', message: '' }}
                className="auth-link-button secondary"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        )}

        <div className="terms-acceptance">
          <p className="terms-text">
            Al crear una solicitud, aceptas nuestros{' '}
            <Link to="/cash-express/terms" className="terms-link">
              Términos y Condiciones
            </Link>
          </p>
        </div>

        <button
          className={`submit-button ${!isFormValid || loading ? 'disabled' : ''}`}
          onClick={handleSubmit}
          disabled={!isFormValid || loading || !isAuthenticated}
        >
          {loading ? '⏳ Creando...' : isAuthenticated ? 'Crear Solicitud' : 'Crear Solicitud'}
        </button>
      </div>

      {/* Modal de Cuentas Bancarias (Portal para evitar desborde en móvil) */}
      {showBankAccounts && createdRequest && createPortal(
        <div className="modal-overlay" onClick={() => setShowBankAccounts(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 Cuentas Bancarias</h3>
              <button
                className="modal-close"
                onClick={() => setShowBankAccounts(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="request-info">
                <p>
                  <strong>🔑 Clave de Retiro:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1em' }}>
                    {createdRequest.folio || `#${createdRequest.id}`}
                  </span>
                </p>
                <p><strong>Total a depositar:</strong> {formatPrice(createdRequest.totalToDeposit)}</p>
              </div>

              {bankAccounts.length > 0 ? (
                <div className="bank-accounts-list">
                  {bankAccounts.map((account) => (
                    <div key={account.id} className="bank-account-card">
                      {account.bankName && (
                        <p className="bank-name">{account.bankName}</p>
                      )}
                      <p className="account-beneficiary">
                        <strong>Beneficiario:</strong> {account.beneficiaryName}
                      </p>
                      <p className="account-number">
                        <strong>Cuenta:</strong> {account.accountNumber}
                      </p>
                      {account.clabe && (
                        <p className="account-clabe">
                          <strong>CLABE:</strong> {account.clabe}
                        </p>
                      )}
                      {account.concept && (
                        <p className="account-concept">
                          <strong>Concepto:</strong> {account.concept}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay cuentas bancarias disponibles.</p>
              )}

              {createdRequest?.estimatedDeliveryDate && (
                <div className="availability-info">
                  <p><strong>Fecha estimada de entrega:</strong></p>
                  <p className="estimated-date">
                    {formatEstimatedDate(createdRequest.estimatedDeliveryDate)}
                  </p>
                  <p className="availability-message">
                    Una vez validado tu depósito, el efectivo estará disponible a partir de esta fecha.
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="primary-button"
                  onClick={() => {
                    setShowBankAccounts(false);
                    navigate('/cash-express/requests');
                  }}
                >
                  Ver Mis Solicitudes
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setShowBankAccounts(false);
                    navigate('/cash-express');
                  }}
                >
                  Crear Otra Solicitud
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmación (Portal) */}
      {showConfirmModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Solicitud</h3>
              <button
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-summary">
                <div className="confirm-summary-item">
                  <span className="confirm-label">Monto:</span>
                  <span className="confirm-value">{formatPrice(amountNum)}</span>
                </div>
                <div className="confirm-summary-item">
                  <span className="confirm-label">Comisión ({commissionPercentage}%):</span>
                  <span className="confirm-value">{formatPrice(commission)}</span>
                </div>
                {totalToDeposit !== totalWithDecimals && (
                  <div className="confirm-summary-item adjustment">
                    <span className="confirm-label">Ajuste:</span>
                    <span className="confirm-value adjustment-value">
                      +{formatPrice(totalToDeposit - totalWithDecimals)}
                    </span>
                  </div>
                )}
                <div className="confirm-divider"></div>
                <div className="confirm-summary-item total">
                  <span className="confirm-total-label">Total a depositar:</span>
                  <span className="confirm-total-value">
                    {formatPrice(totalToDeposit)}
                  </span>
                </div>
              </div>

              <div className="modal-actions confirm-actions">
                <button
                  className="cancel-button"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="confirm-button"
                  onClick={handleConfirmCreate}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de ¿Cómo funciona? (Portal) */}
      {showHowItWorks && createPortal(
        <div className="modal-overlay" onClick={() => setShowHowItWorks(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ℹ️ ¿Cómo funciona?</h3>
              <button
                className="modal-close"
                onClick={() => setShowHowItWorks(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="steps-list">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Ingresa el monto a enviar</h4>
                    <p>Escribe la cantidad de dinero que deseas enviar.</p>
                    <p className="step-detail">El sistema calculará automáticamente la comisión y el total que debes depositar.</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Realiza el depósito bancario</h4>
                    <p>Deposita el total indicado (monto + comisión) en cualquiera de las cuentas bancarias que te proporcionamos después de crear la solicitud.</p>
                    <p className="step-detail">💳 Puedes depositar en efectivo en cualquier banco o transferir desde tu cuenta.</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Sube el comprobante de depósito</h4>
                    <p>Ve a "Mis Solicitudes", selecciona tu solicitud y sube una foto clara del comprobante de depósito. Asegúrate de que se vea el monto, la fecha y hora.</p>
                    <p className="step-detail">📷 Toma la foto en un lugar bien iluminado para que el comprobante se vea claramente.</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Completa los datos del destinatario</h4>
                    <p>Después de subir el comprobante, completa los datos de la persona que recibirá el dinero: nombre, teléfono y relación contigo.</p>
                    <p className="step-detail">👤 Esta información nos ayuda a identificar correctamente a la persona al momento de la entrega.</p>
                  </div>
                </div>

                <div className="step-card">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h4>Validamos y entregamos</h4>
                    <p>Nuestro equipo revisa tu comprobante. Una vez validado, te notificamos la fecha apartir de la cual el dinero está disponible para recoger.</p>
                    <p className="step-detail">La fecha de entrega es varieble puede tardar de 2 a 6 días dependiendo de la cantidad de solicitudes que tengamos en ese momento.</p>
                  </div>
                </div>
              </div>

              <div className="important-info">
                <p><strong>⚠️ Información importante:</strong></p>
                <ul>
                  <li><strong>Zona de entrega:</strong> Solo realizamos entregas en nuestra sucursal ubicada en Yutanducho de Guerrero</li>
                  <li><strong>Conserva tu comprobante:</strong> Es muy importante que guardes y conserves tu comprobante de depósito en buen estado. Si no podemos identificar claramente tu depósito en el comprobante, no nos hacemos responsables de la validación</li>
                  <li><strong>Seguimiento:</strong> Revisa regularmente "Mis Solicitudes" para ver el estado de tu solicitud y el seguimiento del proceso</li>
                </ul>
              </div>

              <div className="terms-link-section">
                <Link to="/cash-express/terms" className="terms-link-modal">
                  📋 Ver Términos y Condiciones
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

