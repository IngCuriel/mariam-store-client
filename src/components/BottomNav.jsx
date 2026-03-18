import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './BottomNav.css';

/** Íconos simples para la barra inferior (inline SVG para consistencia visual) */
const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconFlash = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const IconBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconMore = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

export default function BottomNav() {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  const cartCount = getTotalItems();

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMoreMenu]);

  const handleMoreClick = (e) => {
    e.preventDefault();
    setShowMoreMenu((v) => !v);
  };

  const closeMoreMenu = () => setShowMoreMenu(false);

  const handleLogout = () => {
    closeMoreMenu();
    logout();
  };

  const navItems = [
    { to: '/', label: 'Inicio', icon: IconHome },
    { to: '/cash-express', label: 'Efectivo Express', icon: IconFlash },
    { to: '/cart', label: 'Carrito', icon: IconCart, badge: cartCount },
    { to: '/orders', label: 'Pedidos', icon: IconBox, protected: true },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map((item) => {
        if (item.protected && !user) return null;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-item--active' : ''}`}
            end={item.to === '/'}
          >
            <span className="bottom-nav-icon">
              <item.icon />
              {item.badge != null && item.badge > 0 && (
                <span className="bottom-nav-badge" aria-label={`${item.badge} en carrito`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        );
      })}

      <div className="bottom-nav-item bottom-nav-item--more" ref={moreMenuRef}>
        <button
          type="button"
          className="bottom-nav-button"
          onClick={handleMoreClick}
          aria-expanded={showMoreMenu}
          aria-haspopup="true"
          aria-label="Ver más opciones"
        >
          <span className="bottom-nav-icon">
            <IconMore />
          </span>
          <span className="bottom-nav-label">Más</span>
        </button>

        {showMoreMenu && (
          <div className="bottom-nav-more-menu" role="menu">
            {user && (
              <>
                <Link
                  to="/cash-express/requests"
                  className="bottom-nav-more-item"
                  role="menuitem"
                  onClick={closeMoreMenu}
                >
                  📋 Mis Solicitudes
                </Link>
                <Link
                  to="/addresses"
                  className="bottom-nav-more-item"
                  role="menuitem"
                  onClick={closeMoreMenu}
                >
                  📍 Mis direcciones
                </Link>
                <button
                  type="button"
                  className="bottom-nav-more-item bottom-nav-more-item--logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  🚪 Salir
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/login"
                className="bottom-nav-more-item"
                role="menuitem"
                onClick={closeMoreMenu}
              >
                🔐 Iniciar sesión
              </Link>
            )}
            <Link
              to="/cash-express/terms"
              className="bottom-nav-more-item"
              role="menuitem"
              onClick={closeMoreMenu}
            >
              📄 Términos y Condiciones
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
