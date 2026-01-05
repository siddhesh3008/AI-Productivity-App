import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../utils/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const { data } = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        if (token) {
            verifyEmail();
        } else {
            setStatus('error');
            setMessage('Invalid verification link');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-primary-700 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
                    {status === 'loading' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
                                <Loader className="w-8 h-8 text-primary-500 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Verifying Your Email
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Please wait while we verify your email address...
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Email Verified!
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {message}
                            </p>
                            <p className="text-sm text-gray-500">
                                Redirecting to dashboard...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Verification Failed
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {message}
                            </p>
                            <div className="space-y-3">
                                <Link
                                    to="/login"
                                    className="block w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
                                >
                                    Go to Login
                                </Link>
                                <p className="text-sm text-gray-500">
                                    You can request a new verification email from your settings after logging in.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
