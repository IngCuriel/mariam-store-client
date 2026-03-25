import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './BottomNav.css';

const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
/** Icono “enviar” (avión de papel) para Efectivo Express */
const IconSend = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
const IconBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconUser = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Barra inferior móvil — orden pensado para la jornada del usuario:
 * Tienda → Pedidos → Efectivo Express → Cuenta (carrito, perfil, etc.)
 */
export default function BottomNav() {
  const { user, logout } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!showAccountMenu) return;
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAccountMenu]);

  const toggleAccountMenu = (e) => {
    e.preventDefault();
    setShowAccountMenu((v) => !v);
  };

  const closeAccountMenu = () => setShowAccountMenu(false);

  const handleLogout = () => {
    closeAccountMenu();
    logout();
  };

  const mainNavItems = [
    { to: '/', label: 'Tienda', icon: IconHome, end: true },
    { to: '/orders', label: 'Pedidos', icon: IconBox },
    { to: '/cash-express', label: 'Efectivo', icon: IconSend },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {mainNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item--active' : ''}`}
          end={item.end === true}
        >
          <span className="bottom-nav-icon">
            <item.icon />
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}

      <div className="bottom-nav-item bottom-nav-item--account" ref={accountMenuRef}>
        <button
          type="button"
          className={`bottom-nav-button ${showAccountMenu ? 'bottom-nav-button--open' : ''}`}
          onClick={toggleAccountMenu}
          aria-expanded={showAccountMenu}
          aria-haspopup="true"
          aria-label="Menú de cuenta y ajustes"
        >
          <span className="bottom-nav-icon">
            <IconUser />
          </span>
          <span className="bottom-nav-label">Cuenta</span>
        </button>

        {showAccountMenu && (
          <div className="bottom-nav-account-sheet" role="menu" aria-label="Opciones de cuenta">
            <p className="bottom-nav-account-sheet-title">Tu cuenta</p>
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>👤</span>
                  <span>Mi perfil</span>
                </Link>
                <Link
                  to="/cart"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>🛒</span>
                  <span>Carrito</span>
                </Link>
                <Link
                  to="/cash-express/requests"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>📋</span>
                  <span>Mis solicitudes</span>
                </Link>
                <Link
                  to="/addresses"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>📍</span>
                  <span>Mis direcciones</span>
                </Link>
                <div className="bottom-nav-account-divider" role="presentation" />
                <Link
                  to="/cash-express/terms"
                  className="bottom-nav-account-item bottom-nav-account-item--muted"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>📄</span>
                  <span>Términos y condiciones</span>
                </Link>
                <button
                  type="button"
                  className="bottom-nav-account-item bottom-nav-account-item--logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bottom-nav-account-item bottom-nav-account-item--primary"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>🔐</span>
                  <span>Iniciar sesión</span>
                </Link>
                <Link
                  to="/register"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>✨</span>
                  <span>Crear cuenta</span>
                </Link>
                <Link
                  to="/cart"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>🛒</span>
                  <span>Carrito</span>
                </Link>
                <Link
                  to="/orders"
                  className="bottom-nav-account-item"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>📦</span>
                  <span>Mis pedidos</span>
                </Link>
                <div className="bottom-nav-account-divider" role="presentation" />
                <Link
                  to="/cash-express/terms"
                  className="bottom-nav-account-item bottom-nav-account-item--muted"
                  role="menuitem"
                  onClick={closeAccountMenu}
                >
                  <span className="bottom-nav-account-item-icon" aria-hidden>📄</span>
                  <span>Términos y condiciones</span>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
