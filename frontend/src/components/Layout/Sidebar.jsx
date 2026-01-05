import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    StickyNote,
    CheckSquare,
    MessageSquare,
    Settings,
    X,
    Sparkles,
    Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
        { path: '/notes', icon: StickyNote, label: 'Notes', badge: null },
        { path: '/tasks', icon: CheckSquare, label: 'Tasks', badge: null },
        { path: '/assistant', icon: MessageSquare, label: 'AI Assistant', badge: 'AI' },
        { path: '/settings', icon: Settings, label: 'Settings', badge: null },
    ];

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get user initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 min-h-screen fixed left-0 top-0 pt-20 z-50
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                bg-gradient-to-b from-white via-gray-50 to-white
                dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
                border-r border-gray-200 dark:border-gray-700/50
                shadow-xl shadow-gray-200/50 dark:shadow-black/20
                flex flex-col
            `}>
                {/* Decorative gradient orb */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-emerald-500/5 dark:from-teal-500/20 dark:to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Mobile close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 lg:hidden rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* User Profile Mini Card */}
                <div className="px-4 mb-3 relative flex-shrink-0">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-700/50 border border-gray-200/80 dark:border-gray-600/30 shadow-sm">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-500/25">
                                    {getInitials(user?.name)}
                                </div>
                                {/* Online indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-800" />
                            </div>

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                    {getGreeting()} 👋
                                </p>
                                <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                                    {user?.name || 'User'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Label */}
                <div className="px-6 mb-1 flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">
                        Menu
                    </p>
                </div>

                {/* Navigation - Scrollable area */}
                <nav className="px-4 space-y-1 relative flex-shrink-0">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Glow effect on active */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 blur-xl" />
                                    )}

                                    {/* Icon with background */}
                                    <div className={`relative p-1.5 rounded-lg transition-all duration-300 ${isActive
                                            ? 'bg-white/20'
                                            : 'bg-gray-100 dark:bg-gray-700/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-600/50'
                                        }`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>

                                    {/* Label */}
                                    <span className="font-medium text-sm relative">{item.label}</span>

                                    {/* Badge */}
                                    {item.badge && (
                                        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                            }`}>
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Hover indicator */}
                                    {!isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-gradient-to-b from-teal-400 to-emerald-400 rounded-r-full group-hover:h-6 transition-all duration-300" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Spacer */}
                <div className="flex-1 min-h-4" />

                {/* Divider */}
                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent flex-shrink-0" />

                {/* Pro Tip Card - Fixed at bottom */}
                <div className="p-4 flex-shrink-0 hidden lg:block">
                    <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-500/10 dark:to-emerald-500/5 border border-teal-200 dark:border-teal-500/20 backdrop-blur-sm">
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 dark:from-teal-400/30 dark:to-emerald-400/30 rounded-full blur-2xl" />

                        {/* Content */}
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="p-1 rounded-md bg-gradient-to-br from-teal-400 to-emerald-400">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <h3 className="font-bold text-sm text-gray-800 dark:text-white">Pro Tip</h3>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                Use the AI Assistant to get personalized productivity insights!
                            </p>

                            {/* Action hint */}
                            <div className="mt-2 flex items-center gap-1 text-teal-600 dark:text-teal-400 text-[10px] font-medium">
                                <Zap className="w-3 h-3" />
                                <span>Try it now →</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom gradient fade for mobile */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none lg:hidden" />
            </aside>
        </>
    );
};

export default Sidebar;
