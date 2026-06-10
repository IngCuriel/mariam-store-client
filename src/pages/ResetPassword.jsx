import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { validatePasswordResetToken, resetPassword } from '../services/authService';
import './Login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenError('El enlace no es válido. Solicita uno nuevo.');
      return;
    }

    let cancelled = false;
    validatePasswordResetToken(token)
      .then((data) => {
        if (cancelled) return;
        setTokenValid(Boolean(data.valid));
        if (!data.valid) {
          setTokenError(data.error || 'El enlace no es válido o ya expiró.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setTokenValid(false);
        setTokenError(err.response?.data?.error || 'El enlace no es válido o ya expiró.');
      });

    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login', {
        replace: true,
        state: { message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Verificando enlace...</h2>
          </div>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>⏳ Un momento</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Enlace no válido</h2>
            <p className="auth-subtitle">{tokenError}</p>
          </div>
          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-footer-link">
              <span>📩</span>
              <span>Solicitar nuevo enlace</span>
            </Link>
            <Link to="/login" className="auth-footer-link" style={{ marginTop: 12 }}>
              <span>←</span>
              <span>Iniciar sesión</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Nueva contraseña</h2>
          <p className="auth-subtitle">Elige una contraseña segura para tu cuenta</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="message-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}>
            <label htmlFor="new-password">
              <span className="label-icon">🔒</span>
              Nueva contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
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

          <div className={`form-group ${focusedField === 'confirmPassword' ? 'focused' : ''} ${confirmPassword ? 'has-value' : ''}`}>
            <label htmlFor="confirm-password">
              <span className="label-icon">🔒</span>
              Confirmar contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                required
                minLength={6}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner">⏳</span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Guardar contraseña</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
