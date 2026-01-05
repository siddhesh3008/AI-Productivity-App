import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Check Your Email
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>.
                            The link will expire in 10 minutes.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => { setSent(false); setEmail(''); }}
                                className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Try Another Email
                            </button>
                            <Link
                                to="/login"
                                className="block w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-center font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
                            >
                                Back to Login
                            </Link>
                        </div>
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
                            <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Forgot Password?
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            No worries! Enter your email and we'll send you a reset link.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
