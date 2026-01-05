import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, User, Lock, Bell, Palette, Globe, LogOut,
    Save, Camera, Trash2, Eye, EyeOff, Check, X, AlertTriangle, Users,
    Link2, Unlink, Smartphone, Monitor, Tablet, Mail, CheckCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const { user, logout, updateUser, linkGoogleAccount, unlinkGoogleAccount, resendVerificationEmail, googleLoaded } = useAuth();
    const { theme, setTheme } = useTheme();

    // Profile state
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [profileLoading, setProfileLoading] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Preferences state
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        taskReminders: true,
    });
    const [preferencesLoading, setPreferencesLoading] = useState(false);

    // Sessions state
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Google linking state
    const [googleLoading, setGoogleLoading] = useState(false);
    const [verificationLoading, setVerificationLoading] = useState(false);

    // Active section
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setAvatar(user.avatar || '');
            if (user.preferences?.notifications) {
                setNotifications(user.preferences.notifications);
            }
        }
    }, [user]);

    // Fetch sessions when on account section
    useEffect(() => {
        if (activeSection === 'account') {
            fetchSessions();
        }
    }, [activeSection]);

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const { data } = await api.get('/auth/sessions');
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setSessionsLoading(false);
        }
    };

    const handleProfileSave = async () => {
        setProfileLoading(true);
        try {
            const res = await api.put('/auth/profile', { name, email, avatar });
            updateUser(res.data);
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setPasswordLoading(true);
        try {
            // Check if user is setting password for first time (OAuth user)
            if (!user?.provider || user.provider !== 'local') {
                await api.post('/auth/set-password', { password: newPassword });
                toast.success('Password set successfully');
            } else {
                const { data } = await api.put('/auth/change-password', {
                    currentPassword,
                    newPassword,
                });
                // Update token if returned
                if (data.token) {
                    localStorage.setItem('token', data.token);
                }
                toast.success('Password changed successfully');
            }
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handlePreferencesSave = async () => {
        setPreferencesLoading(true);
        try {
            await api.put('/auth/preferences', {
                theme,
                notifications,
            });
            toast.success('Preferences saved');
        } catch (err) {
            toast.error('Failed to save preferences');
        } finally {
            setPreferencesLoading(false);
        }
    };

    const handleLinkGoogle = async () => {
        setGoogleLoading(true);
        try {
            await linkGoogleAccount();
        } catch (err) {
            // Error handled in context
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        setGoogleLoading(true);
        try {
            await unlinkGoogleAccount();
        } catch (err) {
            // Error handled in context
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setVerificationLoading(true);
        try {
            await resendVerificationEmail();
        } catch (err) {
            // Error handled in context
        } finally {
            setVerificationLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            setSessions(sessions.filter(s => s._id !== sessionId));
            toast.success('Session revoked');
        } catch (err) {
            toast.error('Failed to revoke session');
        }
    };

    const handleRevokeAllSessions = async () => {
        try {
            await api.post('/auth/sessions/revoke-all', { exceptCurrent: false });
            toast.success('All sessions revoked. Please log in again.');
            logout();
        } catch (err) {
            toast.error('Failed to revoke sessions');
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            const payload = user?.googleId && !deletePassword
                ? { confirmation: deleteConfirmation }
                : { password: deletePassword };

            await api.delete('/auth/account', { data: payload });
            toast.success('Account deleted');
            logout();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    const getDeviceIcon = (device) => {
        switch (device?.toLowerCase()) {
            case 'mobile': return Smartphone;
            case 'tablet': return Tablet;
            default: return Monitor;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const sections = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'connected', label: 'Connected Accounts', icon: Link2 },
        { id: 'preferences', label: 'Preferences', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'account', label: 'Account', icon: Users },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="w-8 h-8 text-primary-500" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            </div>

            {/* Email Verification Banner */}
            {user && !user.emailVerified && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Verify your email</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Please verify your email to access all features
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleResendVerification}
                        disabled={verificationLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        {verificationLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Mail className="w-4 h-4" />
                        )}
                        Resend Email
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${activeSection === section.id
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <section.icon className="w-5 h-5" />
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary-500" />
                                    Profile Information
                                </h2>

                                {/* Avatar and User Info */}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                                            {avatar ? (
                                                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <button className="absolute bottom-0 right-0 p-1.5 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors">
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                            {user?.emailVerified && (
                                                <CheckCircle className="w-4 h-4 text-green-500" title="Email verified" />
                                            )}
                                        </div>
                                        {user?.provider !== 'local' && (
                                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full mt-1">
                                                Signed in with {user?.provider}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={user?.provider !== 'local'}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                        {user?.provider !== 'local' && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Email cannot be changed for {user?.provider} accounts
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Avatar URL (optional)
                                        </label>
                                        <input
                                            type="url"
                                            value={avatar}
                                            onChange={(e) => setAvatar(e.target.value)}
                                            placeholder="https://example.com/avatar.jpg"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleProfileSave}
                                    disabled={profileLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                                >
                                    {profileLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary-500" />
                                    {user?.provider === 'local' ? 'Change Password' : 'Set Password'}
                                </h2>

                                {user?.provider !== 'local' && !user?.password ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-blue-700 dark:text-blue-300">
                                                You signed in with {user?.provider}. Set a password to also be able to log in with email and password.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type={showPasswords ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Confirm Password
                                            </label>
                                            <input
                                                type={showPasswords ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <button
                                            onClick={handlePasswordChange}
                                            disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                                        >
                                            {passwordLoading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Lock className="w-5 h-5" />
                                            )}
                                            Set Password
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords ? 'text' : 'password'}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords(!showPasswords)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                                    >
                                                        {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    New Password
                                                </label>
                                                <input
                                                    type={showPasswords ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type={showPasswords ? 'text' : 'password'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${confirmPassword && newPassword !== confirmPassword
                                                        ? 'border-red-500'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                />
                                                {confirmPassword && newPassword !== confirmPassword && (
                                                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePasswordChange}
                                            disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                                        >
                                            {passwordLoading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Lock className="w-5 h-5" />
                                            )}
                                            Change Password
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Connected Accounts Section */}
                        {activeSection === 'connected' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Link2 className="w-5 h-5 text-primary-500" />
                                    Connected Accounts
                                </h2>

                                <p className="text-gray-600 dark:text-gray-400">
                                    Connect your accounts for easier sign-in and enhanced security.
                                </p>

                                {/* Google Account */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                            <svg width="20" height="20" viewBox="0 0 48 48">
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">Google</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {user?.googleId ? 'Connected' : 'Not connected'}
                                            </p>
                                        </div>
                                    </div>
                                    {user?.googleId ? (
                                        <button
                                            onClick={handleUnlinkGoogle}
                                            disabled={googleLoading || (user?.provider === 'google' && !user?.password)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title={user?.provider === 'google' && !user?.password ? 'Set a password first to unlink Google' : ''}
                                        >
                                            {googleLoading ? (
                                                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Unlink className="w-4 h-4" />
                                            )}
                                            Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLinkGoogle}
                                            disabled={googleLoading || !googleLoaded}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                                        >
                                            {googleLoading ? (
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Link2 className="w-4 h-4" />
                                            )}
                                            Connect
                                        </button>
                                    )}
                                </div>

                                {user?.provider === 'google' && !user?.password && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            💡 <strong>Tip:</strong> Set a password in the Security section to enable email/password login as a backup.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Preferences Section */}
                        {activeSection === 'preferences' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-primary-500" />
                                    App Preferences
                                </h2>

                                {/* Theme */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Theme
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['light', 'dark', 'system'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t)}
                                                className={`p-4 rounded-lg border-2 text-center capitalize font-medium transition-all ${theme === t
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Language */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Globe className="w-4 h-4 inline mr-2" />
                                        Language
                                    </label>
                                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                                        <option value="en">English</option>
                                        <option value="es" disabled>Spanish (Coming Soon)</option>
                                        <option value="fr" disabled>French (Coming Soon)</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handlePreferencesSave}
                                    disabled={preferencesLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                                >
                                    {preferencesLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Save Preferences
                                </button>
                            </div>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary-500" />
                                    Notification Settings
                                </h2>

                                <div className="space-y-4">
                                    {[
                                        { key: 'email', label: 'Email Notifications', desc: 'Receive important updates via email' },
                                        { key: 'push', label: 'Push Notifications', desc: 'Get browser notifications for tasks' },
                                        { key: 'taskReminders', label: 'Task Reminders', desc: 'Remind me about upcoming due dates' },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                                                className={`relative w-12 h-6 rounded-full transition-colors ${notifications[item.key] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications[item.key] ? 'translate-x-6' : ''
                                                        }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handlePreferencesSave}
                                    disabled={preferencesLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                                >
                                    {preferencesLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    Save Notifications
                                </button>
                            </div>
                        )}

                        {/* Account Section */}
                        {activeSection === 'account' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary-500" />
                                    Account Management
                                </h2>

                                {/* Active Sessions */}
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                        <Monitor className="w-4 h-4" />
                                        Active Sessions
                                    </h3>

                                    {sessionsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 py-4">No active sessions found</p>
                                    ) : (
                                        <div className="space-y-2 mb-4">
                                            {sessions.map((session) => {
                                                const DeviceIcon = getDeviceIcon(session.deviceInfo?.device);
                                                return (
                                                    <div
                                                        key={session._id}
                                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <DeviceIcon className="w-5 h-5 text-gray-500" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                    {session.deviceInfo?.browser} on {session.deviceInfo?.os}
                                                                </p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Last active: {formatDate(session.lastActive)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRevokeSession(session._id)}
                                                            className="text-red-500 hover:text-red-600 text-sm font-medium"
                                                        >
                                                            Revoke
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {sessions.length > 1 && (
                                        <button
                                            onClick={handleRevokeAllSessions}
                                            className="text-red-500 hover:text-red-600 text-sm font-medium"
                                        >
                                            Revoke all sessions
                                        </button>
                                    )}
                                </div>

                                {/* Logout */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">Log Out</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Log Out
                                    </button>
                                </div>

                                {/* Delete Account */}
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-red-700 dark:text-red-300">Delete Account</p>
                                            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                                                This action is permanent and cannot be undone. All your data will be deleted.
                                            </p>

                                            {!showDeleteConfirm ? (
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                    Delete My Account
                                                </button>
                                            ) : (
                                                <div className="space-y-3">
                                                    {user?.googleId && user?.provider === 'google' ? (
                                                        <input
                                                            type="text"
                                                            value={deleteConfirmation}
                                                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                            placeholder='Type "DELETE" to confirm'
                                                            className="w-full px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="password"
                                                            value={deletePassword}
                                                            onChange={(e) => setDeletePassword(e.target.value)}
                                                            placeholder="Enter your password to confirm"
                                                            className="w-full px-4 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                        />
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleDeleteAccount}
                                                            disabled={deleteLoading || (user?.googleId && user?.provider === 'google' ? deleteConfirmation !== 'DELETE' : !deletePassword)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {deleteLoading ? (
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Check className="w-4 h-4" />
                                                            )}
                                                            Confirm Delete
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteConfirmation(''); }}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
