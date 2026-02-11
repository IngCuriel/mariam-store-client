import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import NotificationBell from './NotificationBell';
import storeIcon from '../assets/images/icon.png';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
            {user && (
              <div className="header-mobile-notifications">
                <NotificationBell />
              </div>
            )}
            <Link
              to="/cart"
              className="header-mobile-cart"
              onClick={() => setShowMobileMenu(false)}
              aria-label="Carrito"
            >
              🛒
              {cartItemsCount > 0 && (
                <span className="cart-badge cart-badge-mobile">{cartItemsCount}</span>
              )}
            </Link>
          </div>

          <nav className="header-nav desktop-nav">
            <Link to="/cash-express" className="nav-link">
              ⚡ Efectivo Express
            </Link>
            <Link to="/products" className="nav-link">
              🛍️ Productos
            </Link>
            {user ? (
              <>
                <NotificationBell />
                <Link to="/cart" className="nav-link cart-link">
                  🛒 Carrito
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">{cartItemsCount}</span>
                  )}
                </Link>
                <div className="user-menu-container">
                  <button
                    className="user-menu-button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    👤 {user.name}
                  </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    {/* <Link
                      to="/orders"
                      className="menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📦 Mis Pedidos
                    </Link> */}
                    <button className="menu-item" onClick={handleLogout}>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
                </div>
              </>
            ) : (
              <>
                <Link to="/cart" className="nav-link cart-link">
                  🛒 Carrito
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">{cartItemsCount}</span>
                  )}
                </Link>
                <Link to="/login" className="nav-link login-link">
                  Iniciar Sesión
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
          {/* Menús ocultos para primera versión - Solo Efectivo Express y Mis Solicitudes */}
          {/* <Link
            to="/"
            className="sidebar-link"
            onClick={() => setShowMobileMenu(false)}
          >
            <span className="sidebar-icon">🛍️</span>
            <span>Productos</span>
          </Link> */}
          <Link
            to="/cash-express"
            className="sidebar-link"
            onClick={() => setShowMobileMenu(false)}
          >
            <span className="sidebar-icon">⚡</span>
            <span>Efectivo Express</span>
          </Link>
          <Link
            to="/products"
            className="sidebar-link"
            onClick={() => setShowMobileMenu(false)}
          >
            <span className="sidebar-icon">🛍️</span>
            <span>Productos</span>
          </Link>
          {user && (
            <Link
              to="/cash-express/requests"
              className="sidebar-link"
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="sidebar-icon">📋</span>
              <span>Mis Solicitudes</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="sidebar-user-info">
                <span className="sidebar-user-icon">👤</span>
                <div className="sidebar-user-details">
                  <span className="sidebar-user-name">{user.name}</span>
                  <span className="sidebar-user-email">{user.email}</span>
                </div>
              </div>
              <div className="sidebar-user-menu">
                {/* <Link
                  to="/orders"
                  className="sidebar-menu-item"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span>📦</span>
                  <span>Mis Pedidos</span>
                </Link> */}
                <button
                  className="sidebar-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <span>🚪</span>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="sidebar-login-button"
              onClick={() => setShowMobileMenu(false)}
            >
              <span>🔐</span>
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

