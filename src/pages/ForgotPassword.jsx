import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authService';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      const data = await requestPasswordReset(email.trim());
      setSuccess(data.message || 'Revisa tu correo para continuar.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar la solicitud. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p className="auth-subtitle">
            Te enviaremos un enlace para crear una contraseña nueva
          </p>
        </div>

        {success && (
          <div className="success-message">
            <span className="message-icon">✅</span>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="message-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}>
            <label htmlFor="forgot-email">
              <span className="label-icon">📧</span>
              Correo electrónico
            </label>
            <input
              type="email"
              id="forgot-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              inputMode="email"
              disabled={Boolean(success)}
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading || Boolean(success)}>
            {loading ? (
              <>
                <span className="button-spinner">⏳</span>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>📩</span>
                <span>Enviar enlace</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-footer-link">
            <span>←</span>
            <span>Volver a iniciar sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
