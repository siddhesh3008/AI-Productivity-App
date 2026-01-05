import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import GoogleButton, { AuthDivider } from '../components/common/GoogleButton';

const Login = () => {
    const navigate = useNavigate();
    const { login, triggerGoogleLogin, googleLoaded } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await triggerGoogleLogin();
            navigate('/dashboard');
        } catch (error) {
            console.error('Google login failed:', error);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-primary-700 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mb-4">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Sign in to your AI Productivity App
                        </p>
                    </div>

                    {/* Google Sign-In */}
                    <GoogleButton
                        onClick={handleGoogleLogin}
                        loading={googleLoading}
                        disabled={!googleLoaded}
                        text="Continue with Google"
                    />

                    <AuthDivider text="or continue with email" />

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            icon={Mail}
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            required
                        />

                        <Button type="submit" loading={loading} className="w-full">
                            Sign In
                        </Button>
                    </form>

                    {/* Forgot Password */}
                    <div className="text-center mt-4">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-gray-500 hover:text-primary-500 transition-colors"
                        >
                            Forgot your password?
                        </Link>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="text-primary-500 hover:text-primary-600 font-medium"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Info hint */}
                <div className="text-center mt-6 text-white text-sm">
                    <p className="opacity-90">
                        New here? Create an account to start boosting your productivity with AI
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
