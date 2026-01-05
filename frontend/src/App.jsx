import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notes = lazy(() => import('./pages/Notes'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading fallback component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <NotificationProvider>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 3000,
                                style: {
                                    background: '#363636',
                                    color: '#fff',
                                },
                                success: {
                                    duration: 3000,
                                    iconTheme: {
                                        primary: '#14b8a6',
                                        secondary: '#fff',
                                    },
                                },
                                error: {
                                    duration: 4000,
                                    iconTheme: {
                                        primary: '#ef4444',
                                        secondary: '#fff',
                                    },
                                },
                            }}
                        />

                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                {/* Public routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />
                                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                                {/* Protected routes */}
                                <Route
                                    path="/"
                                    element={
                                        <PrivateRoute>
                                            <Layout />
                                        </PrivateRoute>
                                    }
                                >
                                    <Route index element={<Navigate to="/dashboard" replace />} />
                                    <Route path="dashboard" element={<Dashboard />} />
                                    <Route path="notes" element={<Notes />} />
                                    <Route path="tasks" element={<Tasks />} />
                                    <Route path="assistant" element={<Assistant />} />
                                    <Route path="settings" element={<Settings />} />
                                </Route>

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </NotificationProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
