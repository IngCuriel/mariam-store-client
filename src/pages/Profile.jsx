import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';
import { getProfile } from '../services/authService';
import { Toast } from '../components/Toast';
import storeIcon from '../assets/images/icon.png';
import './Profile.css';

const MAX_NAME = 120;

/** Payload único para lector en caja (versión explícita para integraciones futuras). */
function buildLoyaltyPayload(userId) {
  return JSON.stringify({
    app: 'MSC',
    type: 'loyalty',
    v: 1,
    uid: userId,
  });
}

function formatMemberCode(id) {
  const s = String(id).padStart(8, '0');
  return `${s.slice(0, 4)} ${s.slice(4)}`;
}

function formatMemberSince(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function Profile() {
  const { user, updateUserName } = useAuth();
  const [name, setName] = useState('');
  const [profileMeta, setProfileMeta] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const data = await getProfile();
      setProfileMeta(data);
      setName(data?.name ?? user?.name ?? '');
    } catch {
      setProfileMeta(null);
      setName(user?.name ?? '');
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.name]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const displayUser = profileMeta || user;
  const loyaltyValue = useMemo(
    () => (displayUser?.id != null ? buildLoyaltyPayload(displayUser.id) : ''),
    [displayUser?.id],
  );

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setToast({ open: true, message: 'Escribe tu nombre.', type: 'info' });
      return;
    }
    if (trimmed.length > MAX_NAME) {
      setToast({ open: true, message: `Máximo ${MAX_NAME} caracteres.`, type: 'info' });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUserName(trimmed);
      setProfileMeta((prev) => ({ ...(prev || {}), ...updated }));
      setToast({ open: true, message: 'Nombre actualizado.', type: 'success' });
    } catch (err) {
      setToast({
        open: true,
        message: err.response?.data?.error || 'No se pudo guardar. Intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const nameUnchanged = (displayUser?.name ?? '').trim() === name.trim();

  return (
    <div className="profile-page">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <header className="profile-header">
        <Link to="/" className="profile-back" aria-label="Volver a la tienda">
          ← Volver
        </Link>
        <h1 className="profile-title">Mi perfil</h1>
        <p className="profile-subtitle">Tu cuenta y tarjeta de lealtad</p>
      </header>

      <div className="profile-layout">
        <section className="profile-section profile-section--card" aria-labelledby="profile-loyalty-heading">
          <h2 id="profile-loyalty-heading" className="profile-section-title visually-hidden">
            Tarjeta de lealtad
          </h2>

          <article className="loyalty-card" aria-label="Tarjeta de socio lealtad Mini Super Curiel">
            <div className="loyalty-card-shine" aria-hidden />
            <div className="loyalty-card-header">
              <div className="loyalty-card-brand">
                <img src={storeIcon} alt="" className="loyalty-card-logo" width={40} height={40} />
                <div>
                  <p className="loyalty-card-store">Mini Super Curiel</p>
                  <p className="loyalty-card-program">Programa de lealtad</p>
                </div>
              </div>
              <span className="loyalty-card-chip" aria-hidden />
            </div>

            <p className="loyalty-card-member-label">Socio</p>
            <p className="loyalty-card-member-name">
              {loadingProfile ? '…' : displayUser?.name || '—'}
            </p>

            <div className="loyalty-card-footer">
              <div>
                <p className="loyalty-card-meta-label">N.º de socio</p>
                <p className="loyalty-card-meta-value">
                  {displayUser?.id != null ? formatMemberCode(displayUser.id) : '—'}
                </p>
              </div>
              <div className="loyalty-card-since">
                <p className="loyalty-card-meta-label">Miembro desde</p>
                <p className="loyalty-card-meta-value">
                  {formatMemberSince(displayUser?.createdAt)}
                </p>
              </div>
            </div>
          </article>

          <div className="loyalty-qr-block">
            <div className="loyalty-qr-wrap" role="img" aria-label="Código QR de identificación de socio">
              {loyaltyValue ? (
                <QRCode
                  value={loyaltyValue}
                  size={168}
                  level="M"
                  className="loyalty-qr-svg"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              ) : (
                <div className="loyalty-qr-placeholder">Cargando…</div>
              )}
            </div>
            <p className="loyalty-qr-hint">
              Muestra este código en caja para identificarte en tus compras y acumular beneficios.
            </p>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="profile-edit-heading">
          <h2 id="profile-edit-heading" className="profile-section-heading">
            Datos personales
          </h2>
          <p className="profile-section-desc">Solo puedes editar tu nombre. El correo no se puede cambiar desde aquí.</p>

          <form onSubmit={handleSaveName} className="profile-form">
            <label htmlFor="profile-name" className="profile-label">
              Nombre completo
            </label>
            <input
              id="profile-name"
              type="text"
              className="profile-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME}
              autoComplete="name"
              disabled={loadingProfile || saving}
              placeholder="Tu nombre"
            />
            <div className="profile-readonly">
              <span className="profile-readonly-label">Correo</span>
              <span className="profile-readonly-value">{displayUser?.email ?? '—'}</span>
            </div>
            <button
              type="submit"
              className="profile-btn-primary"
              disabled={saving || loadingProfile || nameUnchanged || !name.trim()}
            >
              {saving ? 'Guardando…' : 'Guardar nombre'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
