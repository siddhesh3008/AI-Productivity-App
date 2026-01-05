import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import GoogleButton, { AuthDivider } from '../components/common/GoogleButton';

const Signup = () => {
    const navigate = useNavigate();
    const { register, triggerGoogleLogin, googleLoaded } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password);
            navigate('/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        try {
            await triggerGoogleLogin();
            navigate('/dashboard');
        } catch (error) {
            console.error('Google signup failed:', error);
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-accent-500 via-primary-500 to-accent-700 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-fade-in">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-3 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full mb-4">
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
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Start your productivity journey with AI
                        </p>
                    </div>

                    {/* Google Sign-Up */}
                    <GoogleButton
                        onClick={handleGoogleSignup}
                        loading={googleLoading}
                        disabled={!googleLoaded}
                        text="Sign up with Google"
                    />

                    <AuthDivider text="or sign up with email" />

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            icon={User}
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />

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
                            error={errors.password}
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            icon={Lock}
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            error={errors.confirmPassword}
                            required
                        />

                        <Button type="submit" loading={loading} className="w-full">
                            Create Account
                        </Button>
                    </form>

                    {/* Verification notice */}
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                        You'll receive a verification email after signing up
                    </p>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-primary-500 hover:text-primary-600 font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
