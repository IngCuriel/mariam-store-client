import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { sanitizeReturnPath } from '../config/features';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { logLogin } = useAnalytics();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnTo, setReturnTo] = useState(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    // Obtener ruta de retorno y mensaje desde location state
    if (location.state) {
      setReturnTo(location.state.returnTo || null);
      setMessage(location.state.message || '');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación básica
    if (!formData.email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!formData.password) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Registrar evento de login en Analytics
      logLogin('email');
      // Redirigir a la ruta de retorno si existe, o a home
      navigate(sanitizeReturnPath(returnTo));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Bienvenido de vuelta</h2>
          <p className="auth-subtitle">Inicia sesión para continuar</p>
        </div>

        {message && (
          <div className="info-message">
            <span className="message-icon">ℹ️</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="message-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${formData.email ? 'has-value' : ''}`}>
            <label htmlFor="email">
              <span className="label-icon">📧</span>
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setError('');
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${formData.password ? 'has-value' : ''}`}>
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError('');
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner">⏳</span>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            ¿No tienes una cuenta?
          </p>
          <Link
            to="/register"
            state={returnTo ? { returnTo, message } : undefined}
            className="auth-footer-link"
          >
            <span>✨</span>
            <span>Crear cuenta nueva</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

