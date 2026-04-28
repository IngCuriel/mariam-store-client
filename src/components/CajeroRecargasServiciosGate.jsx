import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CajeroRecargasServicios from '../pages/CajeroRecargasServicios';

const BRIDGE_WAIT_MS = 3500;
const MESSAGE_TYPE = 'MARIAM_STORE_AUTH';

function parseAllowedOrigins() {
  const raw = import.meta.env.VITE_RECARGAS_IFRAME_PARENT_ORIGINS;
  if (typeof raw !== 'string' || !raw.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Espera token vía postMessage desde el POS antes de enviar al login.
 * En producción define VITE_RECARGAS_IFRAME_PARENT_ORIGINS (orígenes del POS, separados por coma).
 */
export default function CajeroRecargasServiciosGate() {
  const { isAuthenticated, loading } = useAuth();
  const [waitBridge, setWaitBridge] = useState(() => !localStorage.getItem('auth_token'));

  useEffect(() => {
    if (!waitBridge) return undefined;
    const t = globalThis.setTimeout(() => setWaitBridge(false), BRIDGE_WAIT_MS);
    return () => globalThis.clearTimeout(t);
  }, [waitBridge]);

  const onMessage = useCallback((event) => {
    const allowed = parseAllowedOrigins();
    const dev = import.meta.env.DEV;
    if (allowed.length > 0 && !allowed.includes(event.origin)) {
      return;
    }
    if (allowed.length === 0 && !dev) {
      return;
    }
    const data = event.data;
    if (!data || data.type !== MESSAGE_TYPE || typeof data.token !== 'string' || !data.token) {
      return;
    }
    localStorage.setItem('auth_token', data.token);
    if (data.user != null) {
      try {
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      } catch {
        /* ignore */
      }
    }
    globalThis.window.location.reload();
  }, []);

  useEffect(() => {
    globalThis.window.addEventListener('message', onMessage);
    return () => globalThis.window.removeEventListener('message', onMessage);
  }, [onMessage]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
          padding: 24,
        }}
      >
        Cargando…
      </div>
    );
  }

  if (waitBridge && !isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40vh',
          padding: 24,
          textAlign: 'center',
          color: '#475569',
        }}
      >
        <p style={{ margin: 0, fontSize: '1rem' }}>Conectando sesión con el POS…</p>
        <p style={{ margin: '12px 0 0', fontSize: '0.875rem' }}>
          Si no avanza, inicia sesión como administrador en esta ventana.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <CajeroRecargasServicios />;
}
