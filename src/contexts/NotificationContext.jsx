import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getNotifications as getNotificationsService,
  getUnreadCount as getUnreadCountService,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService,
} from '../services/notificationsService';

const NotificationContext = createContext(undefined);

const POLLING_INTERVAL = 30000; // 30 segundos

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones del servidor
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]);

  // Polling para verificar nuevas notificaciones
  useEffect(() => {
    if (isAuthenticated && user) {

    setIsPolling(true);
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, POLLING_INTERVAL);

    // Verificar inmediatamente al montar
    loadNotifications();
    loadUnreadCount();

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const data = await getNotificationsService();
      setNotifications(data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const data = await getUnreadCountService();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error cargando contador:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await markAsReadService(notificationId);
      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
      // Recargar contador
      loadUnreadCount();
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadService();
      // Actualizar estado local
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => (!n.read ? { ...n, read: true, readAt: now } : n))
      );
      // Recargar contador
      loadUnreadCount();
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await deleteNotificationService(notificationId);
      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Recargar contador
      loadUnreadCount();
    } catch (error) {
      console.error('Error eliminando notificación:', error);
    }
  };

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      isPolling,
      loading,
      refreshNotifications: loadNotifications,
    }),
    [notifications, unreadCount, isPolling, loading]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

