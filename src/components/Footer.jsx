import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import storeIcon from '../assets/images/icon.png';
import './Footer.css';

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
);

const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconStore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 9 4 4h16l1 5" />
    <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
    <path d="M3 9h18" />
  </svg>
);

const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconShieldCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconTruck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
    <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

const IconHeadset = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
    <path d="M21 16a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3Z" />
    <path d="M3 16a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H3Z" />
  </svg>
);

const CONTACT_EMAIL = 'minisuper.curiel@gmail.com';
const FACEBOOK_URL = 'https://www.facebook.com/minisuper.curiel';

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
        {/* Franja de confianza */}
        <div className="footer-trust">
          <div className="trust-item">
            <span className="trust-icon"><IconShieldCheck /></span>
            <div className="trust-text">
              <span className="trust-title">Compra segura</span>
              <span className="trust-subtitle">Tus datos siempre protegidos</span>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon"><IconTruck /></span>
            <div className="trust-text">
              <span className="trust-title">Entregas confiables</span>
              <span className="trust-subtitle">Recibe tus pedidos a tiempo</span>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon"><IconHeadset /></span>
            <div className="trust-text">
              <span className="trust-title">Atención cercana</span>
              <span className="trust-subtitle">Te acompañamos en cada compra</span>
            </div>
          </div>
        </div>

        <div className="footer-divider"></div>

        {/* Sección principal del footer */}
        <div className="footer-content">
          {/* Columna 1: Marca */}
          <div className="footer-column footer-column--brand">
            <div className="footer-logo">
              <img src={storeIcon} alt="Mini Super Curiel" className="footer-logo-icon" />
              <span className="footer-logo-text">Mini Super Curiel</span>
            </div>
            <p className="footer-description">
              Tu tienda digital de confianza. Productos de calidad y un servicio
              cercano para hacer tu día a día más fácil.
            </p>
            <div className="footer-social">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Síguenos en Facebook"
              >
                <IconFacebook />
              </a>
            </div>
          </div>

          {/* Columna 2: Comprar */}
          <div className="footer-column">
            <h3 className="footer-title">Comprar</h3>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link" onClick={goToStore}>
                  <span className="footer-link-icon"><IconStore /></span>
                  <span>Tienda online</span>
                </Link>
              </li>
              <li>
                <Link to="/orders" className="footer-link">
                  <span className="footer-link-icon"><IconBox /></span>
                  <span>Mis pedidos</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div className="footer-column">
            <h3 className="footer-title">Contacto</h3>
            <ul className="footer-contact">
              <li className="contact-item">
                <span className="contact-icon"><IconMail /></span>
                <span className="contact-text">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="contact-link">
                    {CONTACT_EMAIL}
                  </a>
                </span>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconFacebook /></span>
                <span className="contact-text">
                  <a
                    href={FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-link"
                  >
                    Mini Super Curiel
                  </a>
                </span>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconPin /></span>
                <span className="contact-text">Tienda digital</span>
              </li>
              <li className="contact-item">
                <span className="contact-icon"><IconClock /></span>
                <span className="contact-text">Lun a Vie · 9:00 AM - 7:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="footer-divider"></div>

        {/* Sección inferior del footer */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>© {currentYear} Mini Super Curiel. Todos los derechos reservados.</p>
          </div>
          <p className="footer-madeby">Hecho con dedicación para nuestra comunidad</p>
        </div>
      </div>
    </footer>
  );
}
