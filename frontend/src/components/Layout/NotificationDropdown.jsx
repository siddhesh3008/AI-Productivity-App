import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, FileText, CheckSquare, Sparkles, Clock } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'task_created':
            case 'task_completed':
            case 'task_due':
            case 'task_overdue':
                return <CheckSquare className="w-4 h-4" />;
            case 'note_created':
                return <FileText className="w-4 h-4" />;
            case 'ai_suggestion':
                return <Sparkles className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'task_completed':
                return 'text-green-500 bg-green-100 dark:bg-green-900/30';
            case 'task_overdue':
                return 'text-red-500 bg-red-100 dark:bg-red-900/30';
            case 'task_due':
                return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
            case 'note_created':
                return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
            case 'ai_suggestion':
                return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
            default:
                return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification._id);
        }

        // Navigate to related entity if exists
        if (notification.relatedEntity?.entityType === 'task') {
            navigate('/tasks');
        } else if (notification.relatedEntity?.entityType === 'note') {
            navigate('/notes');
        }

        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-icon relative"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-white/20 p-1 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Create tasks via AI to see notifications here
                                </p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${getIconColor(notification.type)}`}>
                                            {getIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium truncate ${!notification.read
                                                        ? 'text-gray-900 dark:text-gray-100'
                                                        : 'text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(notification.createdAt)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification._id);
                                                    }}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={clearAll}
                                className="w-full text-center text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors py-1"
                            >
                                Clear all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
