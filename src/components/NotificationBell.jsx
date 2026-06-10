import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { CASH_EXPRESS_ENABLED } from '../config/features';
import './NotificationBell.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    // Navegar al detalle según el tipo
    if (notification.type === 'cash_express') {
      if (CASH_EXPRESS_ENABLED) {
        navigate(`/cash-express/requests/${notification.entityId}`);
      }
    } else if (notification.type === 'order') {
      navigate(`/orders/${notification.entityId}`);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    // No leídas primero, luego por fecha
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all-read"
                onClick={markAllAsRead}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="notification-list">
            {sortedNotifications.length === 0 ? (
              <div className="notification-empty">
                <p>No hay notificaciones</p>
              </div>
            ) : (
              sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-header-item">
                      <h4 className="notification-title">{notification.title}</h4>
                      {!notification.read && <span className="notification-unread-dot"></span>}
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <p className="notification-action">{notification.action}</p>
                    <span className="notification-time">{formatTime(notification.createdAt)}</span>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    aria-label="Eliminar notificación"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

