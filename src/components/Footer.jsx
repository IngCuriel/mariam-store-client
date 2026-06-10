import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CASH_EXPRESS_ENABLED } from '../config/features';
import storeIcon from '../assets/images/icon.png';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const goToStore = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/', { replace: true });
  };

  return (
    <footer className="store-footer">
      <div className="footer-container">
        {/* Sección principal del footer */}
        <div className="footer-content">
          {/* Columna 1: Información de la empresa */}
          <div className="footer-column">
            <div className="footer-logo">
              <img src={storeIcon} alt="Mini Super Curiel" className="footer-logo-icon" />
              <span className="footer-logo-text">Mini Super Curiel</span>
            </div>
            <p className="footer-description">
              Tu tienda digital de confianza. Ofrecemos productos de calidad y 
              servicios convenientes para hacer tu vida más fácil.
            </p>
            <div className="footer-social">
              <a
                href="https://www.facebook.com/minisuper.curiel"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Facebook"
              >
                <span className="social-icon">📘</span>
              </a> 
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div className="footer-column">
            <h3 className="footer-title">Enlaces Rápidos</h3>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link" onClick={goToStore}>
                  🛍️ Tienda Online
                </Link>
              </li>
              {CASH_EXPRESS_ENABLED && (
                <>
                  <li>
                    <Link to="/cash-express" className="footer-link">
                      ⚡ Efectivo Express
                    </Link>
                  </li>
                  <li>
                    <Link to="/cash-express/requests" className="footer-link">
                      📋 Mis Solicitudes
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/orders" className="footer-link">
                  📦 Mis Pedidos
                </Link>
              </li>
              {CASH_EXPRESS_ENABLED && (
                <li>
                  <Link to="/cash-express/terms" className="footer-link">
                    📄 Términos y Condiciones
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Columna 3: Soporte */}
          <div className="footer-column">
            <h3 className="footer-title">Soporte</h3>
            <ul className="footer-links">
              <li>
                <a href="mailto:soporte@minisupercuriel.com" className="footer-link">
                  ✉️ Contacto
                </a>
              </li>
              <li>
              <a
                href="https://www.facebook.com/minisuper.curiel"
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                FACEBOOK: Mini Super Curiel
              </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Información de contacto */}
          <div className="footer-column">
            <h3 className="footer-title">Contacto</h3>
            <ul className="footer-contact">
              <li className="contact-item">
                <span className="contact-icon">📍</span>
                <span className="contact-text">
                  Tienda Digital
                </span>
              </li>
              <li className="contact-item">
                <span className="contact-icon">📧</span>
                <span className="contact-text">
                  <a href="mailto:minisuper.curiel@gmail.com" className="contact-link">
                    minisuper.curiel@gmail.com
                  </a> 
                </span>
              </li>
              <li className="contact-item">
                <span className="contact-icon">⏰</span>
                <span className="contact-text">
                  Lun - Vie: 9:00 AM - 7:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="footer-divider"></div>

        {/* Sección inferior del footer */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>
              © {currentYear} Mini Super Curiel. Todos los derechos reservados.
            </p>
          </div>
          <div className="footer-legal">
            {CASH_EXPRESS_ENABLED && (
              <>
                <Link to="/cash-express/terms" className="legal-link">
                  Términos y Condiciones
                </Link>
                <span className="legal-separator">|</span>
              </>
            )}
            <a href="#" className="legal-link">
              Política de Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

