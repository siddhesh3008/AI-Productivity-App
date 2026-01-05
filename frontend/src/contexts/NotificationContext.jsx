import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchNotifications = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data } = await api.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;

        try {
            const { data } = await api.get('/notifications/unread-count');
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [user]);

    const markAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            // Update unread count if deleted notification was unread
            const deletedNotification = notifications.find(n => n._id === notificationId);
            if (deletedNotification && !deletedNotification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications/clear-all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    // Add a new notification locally (for real-time updates)
    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.read) {
            setUnreadCount(prev => prev + 1);
        }
    };

    // Fetch notifications when user logs in
    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
