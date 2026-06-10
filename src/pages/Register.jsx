import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { sanitizeReturnPath } from '../config/features';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const { logSignUp } = useAnalytics();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnTo, setReturnTo] = useState(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    // Obtener ruta de retorno y mensaje desde location state
    if (location.state) {
      setReturnTo(location.state.returnTo || null);
      setMessage(location.state.message || '');
    }
  }, [location]);

  // Calcular fortaleza de contraseña
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (formData.password.length >= 6) strength += 1;
    if (formData.password.length >= 8) strength += 1;
    if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) strength += 1;
    if (/\d/.test(formData.password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength += 1;

    setPasswordStrength(Math.min(strength, 5));
  }, [formData.password]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Débil';
    if (passwordStrength <= 3) return 'Regular';
    if (passwordStrength <= 4) return 'Buena';
    return 'Fuerte';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return '#e74c3c';
    if (passwordStrength <= 3) return '#f39c12';
    if (passwordStrength <= 4) return '#3498db';
    return '#2ecc71';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.name.trim()) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }

    if (!formData.email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    if (!formData.password) {
      setError('Por favor ingresa una contraseña');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      // Registrar evento de registro en Analytics
      logSignUp('email');
      // Redirigir a la ruta de retorno si existe, o a home
      navigate(sanitizeReturnPath(returnTo));
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Crear tu cuenta</h2>
          <p className="auth-subtitle">Únete y disfruta de nuestros servicios</p>
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
          <div className={`form-group ${focusedField === 'name' ? 'focused' : ''} ${formData.name ? 'has-value' : ''}`}>
            <label htmlFor="name">
              <span className="label-icon">👤</span>
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setError('');
              }}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              required
              placeholder="Ej: Juan Pérez"
              autoComplete="name"
            />
          </div>

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
                placeholder="Mínimo 6 caracteres"
                minLength={6}
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
            {formData.password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    }}
                  ></div>
                </div>
                {passwordStrength > 0 && (
                  <span
                    className="password-strength-label"
                    style={{ color: getPasswordStrengthColor() }}
                  >
                    {getPasswordStrengthLabel()}
                  </span>
                )}
              </div>
            )}
            <p className="password-hint">
              💡 La contraseña debe tener al menos 6 caracteres
            </p>
          </div>

          <div className={`form-group ${focusedField === 'confirmPassword' ? 'focused' : ''} ${formData.confirmPassword ? 'has-value' : ''}`}>
            <label htmlFor="confirmPassword">
              <span className="label-icon">🔐</span>
              Confirmar Contraseña
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setError('');
                }}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                required
                placeholder="Repite tu contraseña"
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
            {formData.confirmPassword && formData.password && (
              <div className={`password-match ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                {formData.password === formData.confirmPassword ? (
                  <span>✅ Las contraseñas coinciden</span>
                ) : (
                  <span>❌ Las contraseñas no coinciden</span>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <span className="button-spinner">⏳</span>
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            ¿Ya tienes una cuenta?
          </p>
          <Link
            to="/login"
            state={returnTo ? { returnTo, message } : undefined}
            className="auth-footer-link"
          >
            <span>🚀</span>
            <span>Iniciar sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


