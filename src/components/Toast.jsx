import React, { useEffect } from 'react';
import './Toast.css';

const ICONS = {
  info: 'ℹ️',
  success: '✓',
  error: '✕',
};

export function Toast({ open, message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    if (!open || !onClose || !duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, onClose, duration]);

  if (!open || !message) return null;

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon" aria-hidden="true">
        {ICONS[type] ?? ICONS.info}
      </span>
      <p className="toast-message">{message}</p>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  );
}
