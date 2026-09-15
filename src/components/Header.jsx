import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import NotificationBell from './NotificationBell';
import storeIcon from '../assets/images/icon.png';
import './Header.css';

const IconStore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9 4 4h16l1 5" />
    <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M3 9h18" />
  </svg>
);

const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconLogin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

/** Genera la inicial para el avatar a partir del nombre o email. */
function getInitial(user) {
  const source = user?.name?.trim() || user?.email?.trim() || '';
  return source.charAt(0).toUpperCase() || '?';
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);
  const cartItemsCount = getTotalItems();

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location]);

  // Prevenir scroll cuando el menú móvil está abierto
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  // Cerrar menú de usuario al hacer click afuera o con Escape
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="store-header">
        <div className="header-container">
          <div className="header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Abrir menú"
            >
              <span className={`hamburger ${showMobileMenu ? 'active' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <Link to="/" className="header-logo" onClick={() => setShowMobileMenu(false)}>
              <img src={storeIcon} alt="Mini Super Curiel" className="header-logo-icon" />
              <span className="header-logo-text">Mini Super Curiel</span>
            </Link>
            <div className="header-mobile-right">
              {user && (
                <div className="header-mobile-notifications">
                  <NotificationBell />
                </div>
              )}
              <Link
                to="/cart"
                className="header-mobile-cart"
                onClick={() => setShowMobileMenu(false)}
                aria-label={`Carrito, ${cartItemsCount} artículos`}
              >
                <IconCart />
                {cartItemsCount > 0 && (
                  <span className="cart-badge cart-badge-mobile">{cartItemsCount}</span>
                )}
              </Link>
            </div>
          </div>

          <nav className="header-nav desktop-nav">
            <Link to="/" className="nav-link">
              <span className="nav-link-icon"><IconStore /></span>
              <span>Tienda</span>
            </Link>
            {user ? (
              <>
                <NotificationBell />
                <Link to="/cart" className="nav-icon-button" aria-label={`Carrito, ${cartItemsCount} artículos`}>
                  <IconCart />
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">{cartItemsCount}</span>
                  )}
                </Link>
                <div className="user-menu-container" ref={userMenuRef}>
                  <button
                    type="button"
                    className={`user-menu-button ${showUserMenu ? 'user-menu-button--open' : ''}`}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label="Menú de cuenta"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <span className="user-avatar" aria-hidden>{getInitial(user)}</span>
                    <span className="user-menu-button-name">{user.name}</span>
                    <span className="user-menu-button-chevron" aria-hidden><IconChevron /></span>
                  </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <span className="user-avatar user-avatar--lg" aria-hidden>{getInitial(user)}</span>
                      <div className="user-menu-header-info">
                        <span className="user-menu-header-name">{user.name}</span>
                        <span className="user-menu-header-email">{user.email}</span>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="menu-item-icon"><IconUser /></span>
                      <span>Mi perfil</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="menu-item-icon"><IconBox /></span>
                      <span>Mis pedidos</span>
                    </Link>
                    <Link
                      to="/addresses"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="menu-item-icon"><IconPin /></span>
                      <span>Mis direcciones</span>
                    </Link>
                    <button
                      type="button"
                      className="menu-item menu-item-logout"
                      onClick={handleLogout}
                    >
                      <span className="menu-item-icon"><IconLogout /></span>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <>
                <Link to="/cart" className="nav-icon-button" aria-label={`Carrito, ${cartItemsCount} artículos`}>
                  <IconCart />
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">{cartItemsCount}</span>
                  )}
                </Link>
                <Link to="/login" className="nav-link login-link">
                  Iniciar sesión
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Overlay para móvil */}
      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        ></div>
      )}

      {/* Menú lateral móvil */}
      <aside className={`mobile-sidebar ${showMobileMenu ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={storeIcon} alt="Mini Super Curiel" className="sidebar-logo-icon" />
            <span>Mini Super Curiel</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setShowMobileMenu(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className="sidebar-link"
            onClick={() => setShowMobileMenu(false)}
          >
            <span className="sidebar-icon"><IconStore /></span>
            <span>Tienda online</span>
          </Link>
          {user && (
            <>
              <Link
                to="/orders"
                className="sidebar-link"
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="sidebar-icon"><IconBox /></span>
                <span>Mis pedidos</span>
              </Link>
              <Link
                to="/addresses"
                className="sidebar-link"
                onClick={() => setShowMobileMenu(false)}
              >
                <span className="sidebar-icon"><IconPin /></span>
                <span>Mis direcciones</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="sidebar-user-info">
                <span className="sidebar-user-icon" aria-hidden>{getInitial(user)}</span>
                <div className="sidebar-user-details">
                  <span className="sidebar-user-name">{user.name}</span>
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
              </div>
              <div className="sidebar-user-menu">
                <button
                  className="sidebar-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <span className="sidebar-menu-item-icon"><IconLogout /></span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="sidebar-login-button"
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="sidebar-menu-item-icon"><IconLogin /></span>
              <span>Iniciar sesión</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
