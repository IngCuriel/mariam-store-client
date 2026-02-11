import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🛒 Mini Super Curiel</h1>
        <div className="user-menu">
          {user ? (
            <>
              <span className="user-name">Hola, {user.name}</span>
              <button onClick={logout} className="logout-button">
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link to="/login" className="login-link-button">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </header>

      <main className="home-main">
        <div className="welcome-section">
          <h2>Bienvenido a nuestra tienda digital</h2>
          <p>Explora nuestros productos y realiza tus pedidos desde la comodidad de tu hogar</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🛍️</div>
            <h3>Productos</h3>
            <p>Explora nuestro catálogo completo de productos</p>
            <Link to="/" className="feature-button">
              Ver Productos →
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛒</div>
            <h3>Carrito</h3>
            <p>Gestiona tus productos seleccionados</p>
            <Link to="/cart" className="feature-button">
              Ver Carrito
            </Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Mis Pedidos</h3>
            <p>Revisa el estado de tus pedidos</p>
            <Link to="/orders" className="feature-button">
              Ver Pedidos
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

