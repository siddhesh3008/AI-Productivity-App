import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];
let hasShownSessionToast = false; // Prevent multiple toasts

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Helper to handle logout with notification
const handleSessionExpired = (message = 'Your session has expired. Please log in again.') => {
    if (!hasShownSessionToast) {
        hasShownSessionToast = true;
        toast.error(message, {
            duration: 4000,
            icon: '🔒',
        });
        // Reset flag after some time to allow future toasts
        setTimeout(() => {
            hasShownSessionToast = false;
        }, 5000);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Small delay to let user see the toast
    setTimeout(() => {
        window.location.href = '/login';
    }, 1500);
};

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors with token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Check if this is a refresh token request itself
            if (originalRequest.url?.includes('/auth/refresh-token')) {
                // Refresh token is invalid, logout with notification
                handleSessionExpired('Session expired. Please log in again.');
                return Promise.reject(error);
            }

            // Check for session invalidation
            if (error.response?.data?.code === 'SESSION_INVALIDATED') {
                handleSessionExpired('Your session was ended. Please log in again.');
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                isRefreshing = false;
                handleSessionExpired('Please log in to continue.');
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken,
                });

                const newToken = data.token;
                localStorage.setItem('token', newToken);

                // Process queued requests
                processQueue(null, newToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                handleSessionExpired('Unable to refresh session. Please log in again.');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
