import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const passwordsMatch = password === confirmPassword;
    const passwordValid = password.length >= 6;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordsMatch) {
            setError('Passwords do not match');
            return;
        }

        if (!passwordValid) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Password Reset Success!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Your password has been reset successfully. You'll be redirected to login in a moment.
                        </p>
                        <Link
                            to="/login"
                            className="block w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-center font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Reset Your Password
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Enter your new password below
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {password && !passwordValid && (
                                <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${confirmPassword && !passwordsMatch
                                        ? 'border-red-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !passwordValid || !passwordsMatch}
                            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
