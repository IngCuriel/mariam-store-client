import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/addressesService';
import { Toast } from '../components/Toast';
import { DELIVERY_POSTAL_CODE, DELIVERY_CITY, DELIVERY_STATE } from '../constants/deliveryZone';
import './Addresses.css';

const INITIAL_FORM = {
  label: 'Casa',
  street: '',
  colony: '',
  references: '',
};

export default function Addresses() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ open: true, message, type });
  }, []);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyAddresses();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('No se pudieron cargar las direcciones.', 'error');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const openNew = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || 'Casa',
      street: addr.street || '',
      colony: addr.colony || '',
      references: addr.references || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const street = form.street?.trim();
    const colony = form.colony?.trim();
    if (!street || !colony) {
      showToast('Completa calle y colonia.', 'info');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAddress(editingId, {
          label: form.label?.trim() || 'Casa',
          street,
          colony,
          references: form.references?.trim() || undefined,
        });
        showToast('Dirección actualizada.', 'success');
      } else {
        await createAddress({
          label: form.label?.trim() || 'Casa',
          street,
          colony,
          postalCode: DELIVERY_POSTAL_CODE,
          city: DELIVERY_CITY,
          state: DELIVERY_STATE,
          references: form.references?.trim() || undefined,
          isDefault: list.length === 0,
        });
        showToast('Dirección guardada.', 'success');
      }
      closeForm();
      loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo guardar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      showToast('Dirección predeterminada actualizada.', 'success');
      loadAddresses();
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo actualizar.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    try {
      await deleteAddress(id);
      showToast('Dirección eliminada.', 'info');
      loadAddresses();
      if (editingId === id) closeForm();
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo eliminar.', 'error');
    }
  };

  return (
    <div className="addresses-page">
      <header className="addresses-header">
        <Link to="/orders" className="addresses-back">← Volver</Link>
        <h1 className="addresses-title">Mis direcciones</h1>
        <p className="addresses-subtitle">
          Gestiona tus direcciones de envío para no tener que escribirlas en cada pedido.
        </p>
      </header>

      <div className="addresses-content">
        {loading ? (
          <p className="addresses-loading">Cargando direcciones...</p>
        ) : (
          <>
            <div className="addresses-list">
              {list.map((addr) => (
                <article key={addr.id} className="addresses-card">
                  <div className="addresses-card-body">
                    <div className="addresses-card-header">
                      <span className="addresses-card-label">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="addresses-card-default">Predeterminada</span>
                      )}
                    </div>
                    <p className="addresses-card-line">{addr.street}</p>
                    <p className="addresses-card-line">
                      {addr.colony}, {addr.postalCode} {addr.city}
                      {addr.state ? `, ${addr.state}` : ''}
                    </p>
                    {addr.references?.trim() && (
                      <p className="addresses-card-ref">Ref: {addr.references}</p>
                    )}
                  </div>
                  <div className="addresses-card-actions">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        className="addresses-card-btn"
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        Usar como predeterminada
                      </button>
                    )}
                    <button
                      type="button"
                      className="addresses-card-btn"
                      onClick={() => openEdit(addr)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="addresses-card-btn addresses-card-btn--danger"
                      onClick={() => handleDelete(addr.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {showForm ? (
              <section className="addresses-form-section" aria-labelledby="addresses-form-title">
                <h2 id="addresses-form-title" className="addresses-form-title">
                  {editingId ? 'Editar dirección' : 'Nueva dirección'}
                </h2>
                <form onSubmit={handleSubmit} className="addresses-form">
                  <p className="addresses-form-zone-note">
                    Envío solo a C.P. {DELIVERY_POSTAL_CODE}. Completa los datos faltantes.
                  </p>
                  <label htmlFor="addr-label" className="addresses-form-label">Nombre (ej. Casa, Oficina)</label>
                  <input
                    id="addr-label"
                    type="text"
                    className="addresses-form-input"
                    value={form.label}
                    onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="Casa"
                  />
                  <label htmlFor="addr-street" className="addresses-form-label">Calle y número *</label>
                  <input
                    id="addr-street"
                    type="text"
                    className="addresses-form-input"
                    value={form.street}
                    onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
                    placeholder="Av. Principal 123"
                    required
                  />
                  <label htmlFor="addr-colony" className="addresses-form-label">Colonia *</label>
                  <input
                    id="addr-colony"
                    type="text"
                    className="addresses-form-input"
                    value={form.colony}
                    onChange={(e) => setForm((p) => ({ ...p, colony: e.target.value }))}
                    placeholder="Centro"
                    required
                  />
                  <label htmlFor="addr-ref" className="addresses-form-label">Referencias (opcional)</label>
                  <input
                    id="addr-ref"
                    type="text"
                    className="addresses-form-input"
                    value={form.references}
                    onChange={(e) => setForm((p) => ({ ...p, references: e.target.value }))}
                    placeholder="Entre X y Y"
                  />
                  <div className="addresses-form-actions">
                    <button type="button" className="addresses-btn addresses-btn--secondary" onClick={closeForm} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="addresses-btn addresses-btn--primary" disabled={saving}>
                      {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar dirección'}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <button type="button" className="addresses-add-btn" onClick={openNew}>
                + Agregar dirección
              </button>
            )}
          </>
        )}
      </div>

      <Toast open={toast.open} message={toast.message} type={toast.type} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </div>
  );
}
