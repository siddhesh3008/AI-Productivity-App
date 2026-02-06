import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Load Google Identity Services script
const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts) {
            resolve(window.google);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
        document.head.appendChild(script);
    });
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    // Load Google script on mount
    useEffect(() => {
        loadGoogleScript()
            .then(() => setGoogleLoaded(true))
            .catch(err => console.warn('Google Sign-In not available:', err.message));
    }, []);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Account created successfully! Check your email to verify.');
            return data;
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Welcome back!');
            return data;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    const loginWithGoogle = useCallback(async () => {
        if (!googleLoaded || !window.google?.accounts) {
            toast.error('Google Sign-In is not available');
            throw new Error('Google Sign-In not loaded');
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
            toast.error('Google Sign-In is not configured');
            throw new Error('Google Client ID not configured');
        }

        return new Promise((resolve, reject) => {
            // Use token client which returns access token directly
            // This doesn't require redirect URIs for popup mode
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid email profile',
                ux_mode: 'popup',
                callback: async (response) => {
                    if (response.error) {
                        console.error('Google OAuth error:', response.error);
                        toast.error('Google sign-in was cancelled or failed');
                        reject(new Error(response.error));
                        return;
                    }

                    try {
                        // Send access token to backend
                        const { data } = await api.post('/auth/google', {
                            access_token: response.access_token
                        });
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        localStorage.setItem('user', JSON.stringify(data));
                        setUser(data);
                        toast.success('Welcome!');
                        resolve(data);
                    } catch (error) {
                        const message = error.response?.data?.message || 'Google sign-in failed';
                        toast.error(message);
                        reject(error);
                    }
                },
                error_callback: (error) => {
                    console.error('Google OAuth init error:', error);
                    toast.error('Failed to initialize Google Sign-In. Please try again.');
                    reject(new Error('OAuth initialization failed'));
                }
            });

            client.requestAccessToken();
        });
    }, [googleLoaded]);

    // Manual Google login trigger (for button click) - uses OAuth2 popup
    const triggerGoogleLogin = useCallback(async () => {
        if (!googleLoaded || !window.google?.accounts) {
            toast.error('Google Sign-In is not available');
            return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
            toast.error('Google Sign-In is not configured');
            return;
        }

        return new Promise((resolve, reject) => {
            // Use token client which returns access token directly
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid email profile',
                ux_mode: 'popup',
                callback: async (response) => {
                    if (response.error) {
                        console.error('Google OAuth error:', response.error);
                        toast.error('Google sign-in was cancelled or failed');
                        reject(new Error(response.error));
                        return;
                    }

                    try {
                        // Send access token to backend
                        const { data } = await api.post('/auth/google', {
                            access_token: response.access_token
                        });
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('refreshToken', data.refreshToken);
                        localStorage.setItem('user', JSON.stringify(data));
                        setUser(data);
                        toast.success('Welcome!');
                        resolve(data);
                    } catch (error) {
                        const message = error.response?.data?.message || 'Google sign-in failed';
                        toast.error(message);
                        reject(error);
                    }
                },
                error_callback: (error) => {
                    console.error('Google OAuth init error:', error);
                    toast.error('Failed to initialize Google Sign-In. Please try again.');
                    reject(new Error('OAuth initialization failed'));
                }
            });

            client.requestAccessToken();
        });
    }, [googleLoaded]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out successfully');
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    // Refresh access token
    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }

            const { data } = await api.post('/auth/refresh-token', { refreshToken });
            localStorage.setItem('token', data.token);
            return data.token;
        } catch (error) {
            // Refresh failed, logout
            logout();
            throw error;
        }
    };

    // Link Google account
    const linkGoogleAccount = async () => {
        if (!googleLoaded || !window.google?.accounts) {
            toast.error('Google Sign-In is not available');
            return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        return new Promise((resolve, reject) => {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    try {
                        const { data } = await api.post('/auth/google/link', {
                            credential: response.credential
                        });
                        updateUser({ googleId: true, emailVerified: data.emailVerified });
                        toast.success('Google account linked!');
                        resolve(data);
                    } catch (error) {
                        const message = error.response?.data?.message || 'Failed to link Google account';
                        toast.error(message);
                        reject(error);
                    }
                },
            });

            window.google.accounts.id.prompt();
        });
    };

    // Unlink Google account
    const unlinkGoogleAccount = async () => {
        try {
            await api.post('/auth/google/unlink');
            updateUser({ googleId: false, provider: 'local' });
            toast.success('Google account unlinked');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to unlink Google account';
            toast.error(message);
            throw error;
        }
    };

    // Resend verification email
    const resendVerificationEmail = async () => {
        try {
            await api.post('/auth/resend-verification');
            toast.success('Verification email sent!');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send verification email';
            toast.error(message);
            throw error;
        }
    };

    const value = {
        user,
        login,
        register,
        loginWithGoogle,
        triggerGoogleLogin,
        logout,
        updateUser,
        refreshAccessToken,
        linkGoogleAccount,
        unlinkGoogleAccount,
        resendVerificationEmail,
        isAuthenticated: !!user,
        loading,
        googleLoaded,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
