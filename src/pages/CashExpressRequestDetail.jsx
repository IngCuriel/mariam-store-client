import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getCashExpressRequestById,
  uploadDepositReceipt,
  confirmDepositReceipt,
  updateRecipientData,
  getBankAccounts,
} from '../services/cashExpressService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { STATUS_COLORS, STATUS_LABELS, STATUS_ICONS } from '../constants/cashExpress';
import { Toast } from '../components/Toast';
import './CashExpressRequestDetail.css';

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

export default function CashExpressRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Estados para el formulario (solo destinatario, remitente viene del usuario autenticado)
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [editingRecipientData, setEditingRecipientData] = useState(false);
  const [savingRecipientData, setSavingRecipientData] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '' });
  const pendingConfirmRef = useRef(null);
  const pendingCancelRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);
  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const openConfirm = useCallback((title, message, onConfirm, onCancel) => {
    pendingConfirmRef.current = onConfirm;
    pendingCancelRef.current = onCancel;
    setConfirmDialog({ open: true, title, message });
  }, []);
  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
    pendingConfirmRef.current = null;
    pendingCancelRef.current = null;
  }, []);
  const handleConfirmAction = useCallback(async () => {
    const fn = pendingConfirmRef.current;
    if (fn) {
      try {
        await fn();
      } finally {
        closeConfirm();
      }
    } else {
      closeConfirm();
    }
  }, [closeConfirm]);
  const handleCancelConfirm = useCallback(() => {
    pendingCancelRef.current?.();
    closeConfirm();
  }, [closeConfirm]);

  // Obtener datos del remitente del usuario autenticado
  const getSenderData = () => {
    if (!user) return { name: '', phone: '' };
    return {
      name: user.name || user.email || '',
      phone: user.phone || '', // Si el usuario tiene teléfono en su perfil
    };
  };

  const loadRequest = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const requestData = await getCashExpressRequestById(id);
      setRequest(requestData);

      setRecipientName(requestData.recipientName || '');
      setRecipientPhone(requestData.recipientPhone || '');
      setRelationship(requestData.relationship || '');
      setEditingRecipientData(false);

      if (requestData.status === 'PENDIENTE') {
        loadBankAccounts();
      }
    } catch (error) {
      console.error('Error cargando solicitud:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error cargando cuentas bancarias:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRequest();
    }
  }, [id, isAuthenticated, loadRequest]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequest();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen.', 'error');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen es demasiado grande. Máximo 5MB.', 'error');
      return;
    }

    try {
      setUploadingReceipt(true);

      // Subir imagen a Cloudinary
      const imageUrl = await uploadImageToCloudinary(file, 'cash-express/receipts');

      // Guardar URL en la base de datos
      const updatedRequest = await uploadDepositReceipt(id, imageUrl);
      setRequest(updatedRequest);

      showToast('Comprobante subido. Completa los datos del destinatario antes de enviarlo a revisión.', 'success');
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
      showToast(error.message || 'No se pudo subir el comprobante. Intenta nuevamente.', 'error');
    } finally {
      setUploadingReceipt(false);
      // Resetear el input
      e.target.value = '';
    }
  };

  const handleSaveRecipientData = async () => {
    const senderData = getSenderData();

    if (!senderData.name.trim() || !recipientName.trim() || !relationship.trim()) {
      showToast('Por favor completa todos los campos requeridos del destinatario.', 'error');
      return;
    }

    if (!id || !request) return;

    try {
      setSavingRecipientData(true);
      const updatedRequest = await updateRecipientData(id, {
        senderName: senderData.name.trim(),
        senderPhone: senderData.phone.trim() || '',
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || '',
        relationship: relationship.trim(),
      });
      setRequest(updatedRequest);
      setEditingRecipientData(false);
      showToast('Datos guardados correctamente.', 'success');
    } catch (error) {
      console.error('Error guardando datos:', error);
      showToast(error.response?.data?.error || 'No se pudieron guardar los datos.', 'error');
    } finally {
      setSavingRecipientData(false);
    }
  };

  /** Guardar datos del destinatario y, si hay comprobante, enviarlo a revisión en un solo paso */
  const handleSaveAndSendToReview = async () => {
    const senderData = getSenderData();

    if (!senderData.name.trim() || !recipientName.trim() || !relationship.trim()) {
      showToast('Por favor completa todos los campos requeridos del destinatario.', 'error');
      return;
    }

    if (!id || !request) return;

    const hasReceipt = !!request.depositReceipt;

    try {
      setSavingRecipientData(true);

      const updatedRequest = await updateRecipientData(id, {
        senderName: senderData.name.trim(),
        senderPhone: senderData.phone.trim() || '',
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || '',
        relationship: relationship.trim(),
      });
      setRequest(updatedRequest);
      setEditingRecipientData(false);

      if (hasReceipt) {
        setSavingRecipientData(false);
        openConfirm(
          'Enviar comprobante a revisión',
          'Se guardarán los datos del destinatario y tu comprobante quedará en validación. No podrás modificarlo hasta que sea revisado.',
          async () => {
            setSavingRecipientData(true);
            try {
              const afterConfirm = await confirmDepositReceipt(id);
              setRequest(afterConfirm);
              showToast('Tus datos se guardaron y tu comprobante fue enviado a revisión. Te notificaremos cuando sea validado.', 'success');
            } catch (error) {
              showToast(error.response?.data?.error || error.message || 'No se pudo completar. Intenta de nuevo.', 'error');
            } finally {
              setSavingRecipientData(false);
            }
          },
          () => setSavingRecipientData(false)
        );
        return;
      } else {
        showToast('Datos guardados. Cuando subas tu comprobante de depósito, podrás enviarlo a revisión desde aquí.', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast(error.response?.data?.error || error.message || 'No se pudo completar. Intenta de nuevo.', 'error');
    } finally {
      setSavingRecipientData(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!request?.depositReceipt) {
      showToast('No hay comprobante para enviar. Por favor, sube un comprobante primero.', 'error');
      return;
    }

    const senderData = getSenderData();
    
    // Verificar si los datos están guardados
    const hasSavedData = request.senderName && request.recipientName && request.relationship;

    // Si no hay datos guardados, verificar los datos del estado local
    if (!hasSavedData) {
      if (!senderData.name.trim() || !recipientName.trim() || !relationship.trim()) {
        showToast('Completa todos los datos requeridos del destinatario antes de enviar el comprobante a revisión.', 'error');
        return;
      }

      // Guardar los datos antes de confirmar
      try {
        setUploadingReceipt(true);
        await updateRecipientData(id, {
          senderName: senderData.name.trim(),
          senderPhone: senderData.phone.trim() || '',
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim() || '', // Opcional
          relationship: relationship.trim(),
        });
        await loadRequest();
      } catch (error) {
        console.error('Error guardando datos:', error);
        showToast(error.response?.data?.error || 'No se pudieron guardar los datos. Intenta nuevamente.', 'error');
        setUploadingReceipt(false);
        return;
      }
    }

    // Mostrar modal de confirmación antes de enviar
    openConfirm(
      'Enviar comprobante a revisión',
      '¿Estás seguro? Una vez enviado, no podrás modificarlo hasta que sea revisado.',
      async () => {
        try {
          const updatedRequest = await confirmDepositReceipt(id);
          setRequest(updatedRequest);
          showToast('Comprobante enviado a revisión. Te notificaremos cuando sea validado.', 'success');
        } catch (error) {
          console.error('Error enviando comprobante:', error);
          showToast(error.response?.data?.error || error.message || 'No se pudo enviar el comprobante. Intenta nuevamente.', 'error');
        } finally {
          setUploadingReceipt(false);
        }
      },
      () => setUploadingReceipt(false)
    );
    setUploadingReceipt(false);
    return;
  };

  if (!isAuthenticated) {
    return (
      <div className="request-detail-container">
        <div className="auth-required">
          <div className="auth-icon">🔒</div>
          <h2>Inicio de sesión requerido</h2>
          <p>Necesitas iniciar sesión para ver esta solicitud</p>
          <button className="login-button" onClick={() => navigate('/login')}>
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="request-detail-container">
        <div className="request-detail-loading">
          <div className="loading-spinner">⏳</div>
          <p>Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="request-detail-container">
        <button className="back-button" onClick={() => navigate('/cash-express/requests')}>
          ← Volver
        </button>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Solicitud no encontrada</h3>
          <p>La solicitud que buscas no existe o no tienes permiso para verla.</p>
          <button className="back-button-error" onClick={() => navigate('/cash-express/requests')}>
            Volver a Mis Solicitudes
          </button>
        </div>
      </div>
    );
  }

  const status = request.status;
  const isPending = status === 'PENDIENTE';
  const isReboted = status === 'REBOTADO';
  const isWaiting = status === 'EN_ESPERA_CONFIRMACION';
  const isValidated = status === 'DEPOSITO_VALIDADO';
  const isDelivered = status === 'ENTREGADO';
  const isCanceled = status === 'CANCELADO';

  // Caso 1: si pasaron 48 h desde la creación, ya no se puede subir comprobante
  const depositDeadlineExpired =
    request.depositDeadline && new Date() > new Date(request.depositDeadline);

  const showRecipientForm =
    !depositDeadlineExpired &&
    (((request.status === 'PENDIENTE' || request.status === 'REBOTADO') &&
      request.depositReceipt &&
      (!request.senderName || editingRecipientData)) ||
    (request.status === 'DEPOSITO_VALIDADO' && !request.senderName));

  const confirmModal = confirmDialog.open && createPortal(
    <div
      className="confirm-dialog-overlay"
      onClick={handleCancelConfirm}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="confirm-dialog-content" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-dialog-title" className="confirm-dialog-title">{confirmDialog.title}</h2>
        <p className="confirm-dialog-message">{confirmDialog.message}</p>
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn confirm-dialog-btn--cancel"
            onClick={handleCancelConfirm}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-dialog-btn confirm-dialog-btn--confirm"
            onClick={handleConfirmAction}
          >
            Enviar a revisión
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="request-detail-container">
      {confirmModal}
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
      <button type="button" className="back-button" onClick={() => navigate('/cash-express/requests')}>
        ← Volver
      </button>

      <div className="request-detail-content">
        {/* Siempre: estado y folio (si aplica) */}
        <div className="status-card">
          <div
            className="status-badge"
            style={{
              backgroundColor: `${STATUS_COLORS[request.status]}20`,
              color: STATUS_COLORS[request.status],
            }}
          >
            <span>{STATUS_ICONS[request.status]}</span>
            <span>{STATUS_LABELS[request.status]}</span>
          </div>
          {request.folio && (isValidated || isDelivered) && (
            <div className="folio-container">
              <div className="folio">
                <span className="folio-label">🔑 Clave de retiro:</span>
                <span className="folio-value">{request.folio}</span>
              </div>
              <p className="folio-info">
                Guarda esta clave. El destinatario la necesitará para retirar el dinero.
              </p>
            </div>
          )}
        </div>

        {/* EN_ESPERA_CONFIRMACION: solo mensaje y dar seguimiento */}
        {isWaiting && (
          <>
            <div className="status-message-card">
              <span>⏳</span>
              <p>Tu comprobante está en revisión. Te notificaremos cuando sea validado.</p>
            </div>
            {request.estimatedDeliveryDate && (
              <div className="estimated-card">
                <span className="estimated-label">Fecha estimada de entrega:</span>
                <span className="estimated-value">{formatDate(request.estimatedDeliveryDate)}</span>
              </div>
            )}
          </>
        )}

        {/* CANCELADO: solo mensaje */}
        {isCanceled && (
          <div className="status-message-card">
            <span>🚫</span>
            <p>Esta solicitud fue cancelada.</p>
          </div>
        )}

        {/* REBOTADO: motivo */}
        {isReboted && request.rejectionReason && !depositDeadlineExpired && (
          <div className="rejection-card">
            <div className="rejection-header">
              <span>❌</span>
              <h3 className="rejection-title">Motivo del rechazo</h3>
            </div>
            <p className="rejection-text">{request.rejectionReason}</p>
            <p className="rejection-subtext">
              Corrige lo indicado, sube de nuevo el comprobante y completa los datos del destinatario para reenviar.
            </p>
          </div>
        )}

        {/* Caso 1: plazo de 48 h vencido — ya no se puede subir comprobante, sugerir nueva solicitud */}
        {(isPending || isReboted) && depositDeadlineExpired && (
          <div className="status-message-card deposit-deadline-expired">
            <span className="deadline-icon">⏰</span>
            <div className="deadline-content">
              <h3 className="deadline-title">Plazo de 48 horas vencido</h3>
              <p className="deadline-text">
                El tiempo para subir el comprobante de depósito en esta solicitud ha terminado.
                Ya no puedes subir ni reemplazar el comprobante aquí.
              </p>
              <p className="deadline-action">
                Crea una nueva solicitud para continuar. El tiempo de entrega puede variar según la disponibilidad de saldo.
              </p>
              <button
                type="button"
                className="deadline-new-request-button"
                onClick={() => navigate('/cash-express')}
              >
                Crear nueva solicitud
              </button>
            </div>
          </div>
        )}

        {/* DEPOSITO_VALIDADO: listo para recoger */}
        {isValidated && request.availableFrom && (
          <div className="validated-highlight-card">
            {/*<div className="validated-header">
              <div className="validated-icon-large">✅</div>
              <div className="validated-title-section">
                <h3 className="validated-title">Depósito validado</h3>
                <p className="validated-subtitle">Tu dinero está listo para recoger</p>
              </div>
            </div> */}
            {request.recipientName && (
              <div className="validated-message">
                <span>💬</span>
                <span>Informa a <strong>{request.recipientName}</strong> que puede pasar a recoger efectivo apartir de la fecha y hora indicada.</span>
              </div>
            )}
            <div className="validated-date-section">
              <div className="validated-date-value">{formatDate(request.availableFrom)}</div>
            </div>
            
          </div>
        )}

        {/* Resumen: siempre (salvo solo EN_ESPERA o CANCELADO lo mínimo) */}
        {(isPending || isReboted  || isDelivered) && (
          <div className="summary-card">
            <h3 className="summary-title">Resumen</h3>
            <div className="summary-row">
              <span className="summary-label">Monto que se entregará al destinatario</span>
              <span className="summary-value">{formatPrice(request.amount)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Comisión por el servicio</span>
              <span className="summary-value">{formatPrice(request.totalToDeposit-request.amount)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Total a depositar</span>
              <span className="summary-total-value">{formatPrice(request.totalToDeposit)}</span>
            </div>
          </div>
        )}

        {(isValidated) && (
          <div className="summary-card">
            <h3 className="summary-title">Resumen</h3>
            <div className="summary-row">
              <span className="summary-label">Monto que se entregará al destinatario</span>
              <span className="summary-value">{formatPrice(request.amount)}</span>
            </div> 
          </div>
        )}

        {/* PENDIENTE: cuentas para depósito */}
        {isPending && (
          <div className="bank-accounts-card">
            <h3 className="bank-accounts-title">💳 Cuentas para Depósito</h3>
            {bankAccounts.length === 0 ? (
              <div className="no-accounts">
                <span>💳</span>
                <p>No hay cuentas configuradas. Contacta al administrador.</p>
              </div>
            ) : (
              <div className="bank-accounts-list">
                {bankAccounts.map((account, index) => (
                  <div key={account.id} className="bank-account-item">
                    <div className="bank-account-header">
                      <span>💳</span>
                      <span className="bank-account-name">
                        {account.bankName || 'Banco'}
                      </span>
                    </div>
                    {account.beneficiaryName && (
                      <p className="bank-account-beneficiary">
                        Beneficiario: {account.beneficiaryName}
                      </p>
                    )}
                    <p className="bank-account-detail">
                      {account.accountNumber}
                      {account.clabe && ` | CLABE: ${account.clabe}`}
                    </p>
                    {account.concept && (
                      <p className="bank-account-concept">Concepto: {account.concept}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comprobante ya subido pero plazo 48 h vencido: solo lectura */}
        {(isPending || isReboted) && depositDeadlineExpired && request.depositReceipt && (
          <div className="receipt-card">
            <div className="receipt-header">
              <div className="receipt-header-left">
                <span>📄</span>
                <h3 className="receipt-title">Comprobante (plazo vencido)</h3>
              </div>
              <button
                type="button"
                className="toggle-receipt-button"
                onClick={() => setShowReceipt(!showReceipt)}
                aria-label={showReceipt ? 'Ocultar comprobante' : 'Mostrar comprobante'}
              >
                {showReceipt ? 'Ocultar' : 'Ver comprobante'}
              </button>
            </div>
            {showReceipt && (
              <div className="receipt-image-container">
                <img src={request.depositReceipt} alt="Comprobante de depósito" className="receipt-image" />
              </div>
            )}
            <p className="receipt-deadline-hint">El plazo para subir comprobante venció. Crea una nueva solicitud para continuar.</p>
          </div>
        )}

        {/* Comprobante: PENDIENTE/REBOTADO (solo si no venció 48 h) subir o ver; ENTREGADO solo ver */}
        {(isPending || isReboted || isDelivered) && !depositDeadlineExpired && (
          request.depositReceipt ? (
            <div className="receipt-card">
              <div className="receipt-header">
                <div className="receipt-header-left">
                  <span>✅</span>
                  <h3 className="receipt-title">Comprobante</h3>
                </div>
                <button
                  type="button"
                  className="toggle-receipt-button"
                  onClick={() => setShowReceipt(!showReceipt)}
                  aria-label={showReceipt ? 'Ocultar comprobante' : 'Mostrar comprobante'}
                >
                  {showReceipt ? 'Ocultar' : 'Ver comprobante'}
                </button>
              </div>
              {showReceipt && (
                <div className="receipt-image-container">
                  <img
                    src={request.depositReceipt}
                    alt="Comprobante de depósito"
                    className="receipt-image"
                  />
                </div>
              )}
              {!showReceipt && (
                <p className="receipt-collapsed-hint">Haz clic en &quot;Ver comprobante&quot; para ver la imagen.</p>
              )}
              {(isPending || isReboted) && (
                <div className="receipt-actions">
                  <label className="replace-receipt-button">
                    {uploadingReceipt ? '⏳ Subiendo...' : '📷 Reemplazar comprobante'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploadingReceipt}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (isPending || isReboted) ? (
            <div className="upload-receipt-section">
              <label className="upload-receipt-button">
                {uploadingReceipt ? '⏳ Subiendo...' : '📷 Subir comprobante de depósito'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingReceipt}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          ) : null
        )}

        {/* Datos destinatario: solo cuando aplica, no venció 48 h y no está en modo edición */}
        {(isPending || isReboted || isValidated || isDelivered) &&
          !(depositDeadlineExpired && (isPending || isReboted)) &&
          (request.senderName || request.recipientName) &&
          !editingRecipientData && (
            <div className="section">
              <div className="section-header-with-button">
                <h3 className="section-title">Datos de entrega</h3>
                {(isPending || isReboted) && (
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => setEditingRecipientData(true)}
                  >
                    <span>✏️</span>
                    <span>Editar</span>
                  </button>
                )}
              </div>
              {request.recipientName && (
                <>
                  <div className="info-row-simple">
                    <span className="info-label">Destinatario:</span>
                    <span className="info-value">{request.recipientName}</span>
                  </div>
                  {request.recipientPhone && (
                    <div className="info-row-simple">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{request.recipientPhone}</span>
                    </div>
                  )}
                  {request.relationship && (
                    <div className="info-row-simple">
                      <span className="info-label">Relación:</span>
                      <span className="info-value">{request.relationship}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

        {/* ENTREGADO: detalle completo con fechas */}
        {isDelivered && (
          <div className="section">
            <h3 className="section-title">Detalle</h3>
            <div className="info-row">
              <span>📅</span>
              <div className="info-content">
                <div className="info-label">Creado</div>
                <div className="info-value">{formatDate(request.createdAt)}</div>
              </div>
            </div>
            {request.receiptSentAt && (
              <div className="info-row">
                <span>📤</span>
                <div className="info-content">
                  <div className="info-label">Comprobante enviado</div>
                  <div className="info-value">{formatDate(request.receiptSentAt)}</div>
                </div>
              </div>
            )}
            {request.depositValidatedAt && (
              <div className="info-row">
                <span>✅</span>
                <div className="info-content">
                  <div className="info-label">Validado</div>
                  <div className="info-value">{formatDate(request.depositValidatedAt)}</div>
                </div>
              </div>
            )}
            {request.deliveredAt && (
              <div className="info-row">
                <span>✓</span>
                <div className="info-content">
                  <div className="info-label">Entregado</div>
                  <div className="info-value">{formatDate(request.deliveredAt)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formulario de Datos del Destinatario */}
        {showRecipientForm && (
          <div className="recipient-form">
            <div className="form-header">
              <span>👤</span>
              <h3 className="form-title">
                {request.status === 'DEPOSITO_VALIDADO'
                  ? 'Completar Datos de Entrega'
                  : 'Datos de quien recibe'}
              </h3>
            </div>
            <p className="form-description">
              {request.status === 'DEPOSITO_VALIDADO'
                ? 'Por favor, proporciona los datos del destinatario para proceder con la entrega.'
                : request.depositReceipt
                  ? 'Completa los datos del destinatario del efectivo. despues click en guardar y se enviará a validación.'
                  : 'Completa los datos del destinatario. Después podrás subir y enviar tu comprobante a revisión.'}
            </p>

            <div className="form-section">
              <div className="input-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ej: María González"
                />
              </div>
              <div className="input-group">
                <label>Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="Ej: 9991234567"
                  maxLength={10}
                />
              </div>
              <div className="input-group">
                <label>Relación o referencia para identificar al destinatario *</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Ej: Hermano, Madre, Hijo, Amigo, Vecino, etc."
                />
                <small className="input-hint">
                  Esta información ayuda a identificar correctamente al destinatario al momento de la entrega
                </small>
              </div>
            </div>

            <div className="form-actions form-actions--recipient">
              {editingRecipientData && (
                <button
                  className="cancel-button"
                  type="button"
                  onClick={() => {
                    setEditingRecipientData(false);
                    setRecipientName(request.recipientName || '');
                    setRecipientPhone(request.recipientPhone || '');
                    setRelationship(request.relationship || '');
                  }}
                  disabled={savingRecipientData}
                >
                  Cancelar
                </button>
              )}
              <div className="form-actions-primary">
                <button
                  type="button"
                  className={
                    request.depositReceipt && (isPending || isReboted)
                      ? 'save-button save-button--primary'
                      : 'save-button'
                  }
                  onClick={
                    request.depositReceipt && (isPending || isReboted)
                      ? handleSaveAndSendToReview
                      : handleSaveRecipientData
                  }
                  disabled={
                    savingRecipientData ||
                    !getSenderData().name.trim() ||
                    !recipientName.trim() ||
                    !relationship.trim()
                  }
                >
                  {savingRecipientData
                    ? '⏳ Procesando...'
                    : request.depositReceipt && (isPending || isReboted)
                      ? '✓ Guardar datos y enviar a revisión'
                      : '✓ Guardar datos'}
                </button>
                {request.depositReceipt && (isPending || isReboted) && (
                  <p className="form-action-hint">
                    Se guardarán los datos del destinatario y tu comprobante se enviará a validación.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón enviar comprobante: cuando aplica y no venció el plazo 48 h */}
        {(isPending || isReboted) &&
          !depositDeadlineExpired &&
          request.depositReceipt &&
          request.recipientName &&
          !showRecipientForm && (
            <button
              type="button"
              className="send-receipt-button"
              onClick={handleConfirmReceipt}
              disabled={uploadingReceipt}
            >
              {uploadingReceipt ? (
                '⏳ Enviando...'
              ) : (
                <>
                  <span>📤</span>
                  <span>Enviar comprobante a validar</span>
                </>
              )}
            </button>
          )}
      </div>
    </div>
  );
}

