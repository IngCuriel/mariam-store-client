import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getOrderById,
  getDeliveryTypes,
  confirmOrderByCustomer,
} from '../services/ordersService';
import { getMyAddresses, createAddress } from '../services/addressesService';
import {
  DELIVERY_POSTAL_CODE,
  DELIVERY_CITY,
  DELIVERY_STATE,
} from '../constants/deliveryZone';
import { CAN_ACCEPT_OR_CANCEL } from '../constants/orderStatus';
import { Toast } from '../components/Toast';
import AddressMapPicker from '../components/AddressMapPicker';
import './OrderCheckout.css';

const STEP_DELIVERY = 1;
const STEP_ADDRESS = 2;
const STEP_REVIEW = 3;

const INITIAL_ADDRESS_FORM = {
  label: 'Casa',
  street: '',
  colony: '',
  references: '',
  latitude: null,
  longitude: null,
};

const formatPrice = (price) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price ?? 0);

export default function OrderCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [step, setStep] = useState(STEP_DELIVERY);
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState(null);
  const [loadingDeliveryTypes, setLoadingDeliveryTypes] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(INITIAL_ADDRESS_FORM);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ open: true, message, type });
  };

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || 'No se pudo cargar el pedido.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!order?.id) return;
    setLoadingDeliveryTypes(true);
    getDeliveryTypes(order.branchId ?? null)
      .then((list) => {
        const types = Array.isArray(list) ? list : [];
        setDeliveryTypes(types);
        if (types.length === 1) setSelectedDeliveryType(types[0]);
      })
      .catch(() => setDeliveryTypes([]))
      .finally(() => setLoadingDeliveryTypes(false));
  }, [order?.id, order?.branchId]);

  useEffect(() => {
    if (step !== STEP_ADDRESS || selectedDeliveryType?.code !== 'delivery') return;
    setLoadingAddresses(true);
    getMyAddresses()
      .then((list) => {
        setSavedAddresses(Array.isArray(list) ? list : []);
        const defaultAddr = list?.find((a) => a.isDefault) || list?.[0];
        setSelectedAddressId(defaultAddr?.id ?? null);
        setShowNewAddressForm(list?.length === 0);
      })
      .catch(() => setSavedAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, [step, selectedDeliveryType?.code]);

  const isDelivery = selectedDeliveryType?.code === 'delivery';
  const deliveryCost = selectedDeliveryType?.cost ?? 0;
  const totalWithDelivery = (order?.total ?? 0) + deliveryCost;

  const goToReview = () => {
    if (isDelivery) setStep(STEP_ADDRESS);
    else setStep(STEP_REVIEW);
  };

  const handleConfirmOrder = async () => {
    if (!order?.id) return;
    const payload = {};
    if (selectedDeliveryType) {
      payload.deliveryTypeId = selectedDeliveryType.id;
      payload.deliveryCost = selectedDeliveryType.cost ?? 0;
    }
    if (isDelivery && selectedAddressId != null) {
      payload.addressId = selectedAddressId;
    }
    try {
      setActionLoading(true);
      await confirmOrderByCustomer(order.id, payload);
      setShowSuccessScreen(true);
    } catch (err) {
      showToast(
        err.response?.data?.error || 'No se pudo confirmar. Intenta de nuevo.',
        'error'
      );
    } finally {
      setActionLoading(false);
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
      const payload = {
        label: addressForm.label?.trim() || 'Casa',
        street,
        colony,
        postalCode: DELIVERY_POSTAL_CODE,
        city: DELIVERY_CITY,
        state: DELIVERY_STATE,
        references: addressForm.references?.trim() || undefined,
        isDefault: savedAddresses.length === 0,
      };
      if (addressForm.latitude != null && addressForm.longitude != null) {
        payload.latitude = addressForm.latitude;
        payload.longitude = addressForm.longitude;
      }
      const newAddr = await createAddress(payload);
      setSelectedAddressId(newAddr.id);
      setSavedAddresses((prev) => [...prev, newAddr]);
      setShowNewAddressForm(false);
      setAddressForm(INITIAL_ADDRESS_FORM);
      setStep(STEP_REVIEW);
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo guardar la dirección.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUseSavedAddressAndContinue = () => {
    if (selectedAddressId != null) setStep(STEP_REVIEW);
    else showToast('Elige una dirección.', 'info');
  };

  if (loading) {
    return (
      <div className="order-checkout-page">
        <div className="order-checkout-loading">
          <div className="order-checkout-spinner" aria-hidden="true" />
          <p>Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="order-checkout-page">
        <div className="order-checkout-error">
          <p>{loadError || 'Pedido no encontrado.'}</p>
          <Link to="/orders" className="order-checkout-btn order-checkout-btn--primary">
            Volver a Mis Pedidos
          </Link>
        </div>
      </div>
    );
  }

  if (!CAN_ACCEPT_OR_CANCEL.includes(order.status)) {
    return (
      <div className="order-checkout-page">
        <div className="order-checkout-error">
          <p>Este pedido no está pendiente de confirmación.</p>
          <Link to={`/orders/${order.id}`} className="order-checkout-btn order-checkout-btn--primary">
            Ver detalle del pedido
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { num: STEP_DELIVERY, label: 'Entrega' },
    ...(isDelivery ? [{ num: STEP_ADDRESS, label: 'Dirección' }] : []),
    { num: STEP_REVIEW, label: 'Revisar' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.num === step);

  if (showSuccessScreen) {
    const isPickup = selectedDeliveryType?.code !== 'delivery';
    const branch = order?.branch;
    return (
      <div className="order-checkout-page order-checkout-page--success">
        <div className="order-checkout-success" role="status" aria-live="polite">
          <div className="order-checkout-success-icon" aria-hidden="true">
            ✓
          </div>
          <h1 className="order-checkout-success-title">Pedido confirmado</h1>
          <p className="order-checkout-success-message">
            {isPickup
              ? 'Te avisamos cuando esté listo para recoger.'
              : 'Te avisamos cuando esté en camino.'}
          </p>
          {isPickup && branch && (
            <div className="order-checkout-success-branch">
              <p className="order-checkout-success-branch-label">Recoger en</p>
              <p className="order-checkout-success-branch-name">{branch.name}</p>
              {branch.description && (
                <p className="order-checkout-success-branch-address">{branch.description}</p>
              )}
            </div>
          )}
          <button
            type="button"
            className="order-checkout-success-btn"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            Ver mi pedido
          </button>
        </div>
        <Toast
          open={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />
      </div>
    );
  }

  return (
    <div className="order-checkout-page">
      <header className="order-checkout-header">
        <Link to={`/orders/${order.id}`} className="order-checkout-back">
          ← Volver
        </Link>
        <h1 className="order-checkout-title">Finalizar pedido</h1>
        <p className="order-checkout-subtitle">Pedido #{order.id}</p>
      </header>

      <nav className="order-checkout-steps" aria-label="Pasos del checkout">
        {steps.map((s, idx) => (
          <div
            key={s.num}
            className={`order-checkout-step-indicator ${idx <= currentStepIndex ? 'active' : ''} ${idx === currentStepIndex ? 'current' : ''}`}
          >
            <span className="order-checkout-step-num">{idx + 1}</span>
            <span className="order-checkout-step-label">{s.label}</span>
            {idx < steps.length - 1 && <span className="order-checkout-step-line" aria-hidden="true" />}
          </div>
        ))}
      </nav>

      <div className="order-checkout-content">
        {/* Step 1: Forma de entrega */}
        {step === STEP_DELIVERY && (
          <section className="order-checkout-section" aria-labelledby="checkout-delivery-title">
            <h2 id="checkout-delivery-title" className="order-checkout-section-title">
              ¿Cómo recibes tu pedido?
            </h2>
            {loadingDeliveryTypes ? (
              <p className="order-checkout-muted">Cargando opciones...</p>
            ) : deliveryTypes.length === 0 ? (
              <p className="order-checkout-muted">No hay opciones de entrega. Contacta a la tienda.</p>
            ) : (
              <div className="order-checkout-options" role="group" aria-label="Opciones de entrega">
                {deliveryTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`order-checkout-option ${selectedDeliveryType?.id === type.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDeliveryType(type)}
                  >
                    <span className="order-checkout-option-name">
                      {type.code === 'delivery' ? '📍 Envío a domicilio' : '🏪 Recoger en tienda'}
                    </span>
                    <span className="order-checkout-option-detail">{type.name}</span>
                    <span className="order-checkout-option-cost">
                      {type.cost > 0 ? formatPrice(type.cost) : 'Sin costo'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="order-checkout-actions">
              <Link to={`/orders/${order.id}`} className="order-checkout-btn order-checkout-btn--secondary">
                Cancelar
              </Link>
              <button
                type="button"
                className="order-checkout-btn order-checkout-btn--primary"
                onClick={goToReview}
                disabled={!selectedDeliveryType}
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Dirección (solo envío a domicilio) */}
        {step === STEP_ADDRESS && isDelivery && (
          <section className="order-checkout-section" aria-labelledby="checkout-address-title">
            <h2 id="checkout-address-title" className="order-checkout-section-title">
              Dirección de envío
            </h2>
            <p className="order-checkout-section-desc">
              Elige o agrega una dirección. C.P. {DELIVERY_POSTAL_CODE}.
            </p>
            {loadingAddresses ? (
              <p className="order-checkout-muted">Cargando direcciones...</p>
            ) : !showNewAddressForm ? (
              <>
                {savedAddresses.length > 0 && (
                  <div className="order-checkout-address-list" role="listbox" aria-label="Direcciones">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        role="option"
                        aria-selected={selectedAddressId === addr.id}
                        className={`order-checkout-address-card ${selectedAddressId === addr.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAddressId(addr.id)}
                      >
                        <span className="order-checkout-address-label">
                          {addr.label}
                          {addr.isDefault && <span className="order-checkout-address-default">Predeterminada</span>}
                        </span>
                        <span className="order-checkout-address-line">{addr.street}</span>
                        <span className="order-checkout-address-line">
                          {addr.colony}, {addr.postalCode} {addr.city}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="order-checkout-actions">
                  <button
                    type="button"
                    className="order-checkout-btn order-checkout-btn--secondary"
                    onClick={() => setStep(STEP_DELIVERY)}
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    className="order-checkout-btn order-checkout-btn--outline"
                    onClick={() => setShowNewAddressForm(true)}
                  >
                    + {savedAddresses.length > 0 ? 'Nueva dirección' : 'Agregar dirección'}
                  </button>
                  <button
                    type="button"
                    className="order-checkout-btn order-checkout-btn--primary"
                    onClick={handleUseSavedAddressAndContinue}
                    disabled={savedAddresses.length > 0 && selectedAddressId == null}
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmitNewAddress} className="order-checkout-address-form">
                <label htmlFor="checkout-addr-label">Nombre (ej. Casa, Oficina)</label>
                <input
                  id="checkout-addr-label"
                  type="text"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="Casa"
                />
                <label htmlFor="checkout-addr-street">Calle y número *</label>
                <input
                  id="checkout-addr-street"
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm((p) => ({ ...p, street: e.target.value }))}
                  placeholder="Ej. Av. Principal 123"
                  required
                />
                <label htmlFor="checkout-addr-colony">Colonia *</label>
                <input
                  id="checkout-addr-colony"
                  type="text"
                  value={addressForm.colony}
                  onChange={(e) => setAddressForm((p) => ({ ...p, colony: e.target.value }))}
                  placeholder="Ej. Centro"
                  required
                />
                <label htmlFor="checkout-addr-ref">Referencias (opcional)</label>
                <input
                  id="checkout-addr-ref"
                  type="text"
                  value={addressForm.references}
                  onChange={(e) => setAddressForm((p) => ({ ...p, references: e.target.value }))}
                  placeholder="Entre X y Y..."
                />
                <div className="order-checkout-address-map-section" role="group" aria-labelledby="checkout-map-label">
                  <span id="checkout-map-label" className="order-checkout-address-map-label">
                    Ubicación en el mapa (opcional)
                  </span>
                  <AddressMapPicker
                    latitude={addressForm.latitude}
                    longitude={addressForm.longitude}
                    onLocationChange={(lat, lng) =>
                      setAddressForm((p) => ({ ...p, latitude: lat, longitude: lng }))
                    }
                  />
                </div>
                <div className="order-checkout-actions">
                  <button
                    type="button"
                    className="order-checkout-btn order-checkout-btn--secondary"
                    onClick={() => (savedAddresses.length > 0 ? setShowNewAddressForm(false) : setStep(STEP_DELIVERY))}
                    disabled={actionLoading}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="order-checkout-btn order-checkout-btn--primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Guardando...' : 'Continuar'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Step 3: Revisar y confirmar — solo productos disponibles */}
        {step === STEP_REVIEW && (() => {
          const availableItems = order.items?.filter((item) => item.isAvailable === true) ?? [];
          return (
          <section className="order-checkout-section" aria-labelledby="checkout-review-title">
            <h2 id="checkout-review-title" className="order-checkout-section-title">
              Revisar y confirmar
            </h2>
            {availableItems.length > 0 && (
              <div className="order-checkout-review-delivery-block">
                <p className="order-checkout-review-delivery-title">Recibirás</p>
                <ul className="order-checkout-review-products" aria-label="Productos que recibirás">
                  {availableItems.map((item) => {
                    const qty = item.confirmedQuantity ?? item.quantity;
                    const lineTotal = (qty * (item.unitPrice ?? 0)) || item.subtotal;
                    return (
                      <li key={item.id} className="order-checkout-review-product">
                        <span className="order-checkout-review-product-info">
                          <span className="order-checkout-review-product-name">
                            {item.productName ?? 'Producto'}
                          </span>
                          {item.presentationName && (
                            <span className="order-checkout-review-product-presentation">
                              {item.presentationName}
                            </span>
                          )}
                          <span className="order-checkout-review-product-qty">
                            {qty} × {formatPrice(item.unitPrice)}
                          </span>
                        </span>
                        <span className="order-checkout-review-product-total">
                          {formatPrice(lineTotal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="order-checkout-review-card">
              <div className="order-checkout-review-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {selectedDeliveryType && (
                <>
                  <div className="order-checkout-review-row">
                    <span>Envío</span>
                    <span>
                      {selectedDeliveryType.name} — {deliveryCost > 0 ? formatPrice(deliveryCost) : 'Sin costo'}
                    </span>
                  </div>
                  {isDelivery && selectedAddressId != null && (() => {
                    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
                    return addr ? (
                      <div className="order-checkout-review-row order-checkout-review-address">
                        <span>Enviar a</span>
                        <span>
                          {addr.street}, {addr.colony}, {addr.postalCode} {addr.city}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
              <div className="order-checkout-review-row order-checkout-review-total">
                <span>Total</span>
                <span>{formatPrice(totalWithDelivery)}</span>
              </div>
            </div>
            <div className="order-checkout-actions">
              <button
                type="button"
                className="order-checkout-btn order-checkout-btn--secondary"
                onClick={() => (isDelivery ? setStep(STEP_ADDRESS) : setStep(STEP_DELIVERY))}
              >
                Atrás
              </button>
              <button
                type="button"
                className="order-checkout-btn order-checkout-btn--primary order-checkout-btn--confirm"
                onClick={handleConfirmOrder}
                disabled={actionLoading}
              >
                {actionLoading ? 'Confirmando...' : 'Confirmar'}
              </button>
            </div>
          </section>
          );
        })()}
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
