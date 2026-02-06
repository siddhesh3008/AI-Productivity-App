import React from 'react';
import { BarChart3, User, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ onMenuClick }) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sticky top-0 z-40 lg:ml-64">
            <div className="flex items-center justify-between">
                {/* Left side - Logo + Menu button */}
                <div className="flex items-center gap-3">
                    {/* Mobile menu button */}
                    <button
                        onClick={onMenuClick}
                        className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 lg:hidden shadow-sm"
                    >
                        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>

                    <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" />
                    <h1 className="text-lg sm:text-2xl font-bold" style={{ color: '#14b8a6' }}>
                        AI Productivity
                    </h1>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Theme toggle */}
                    <button onClick={toggleTheme} className="btn-icon">
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5" />
                        ) : (
                            <Sun className="w-5 h-5" />
                        )}
                    </button>

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* User menu */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user?.email}
                            </p>
                        </div>
                        <div className="relative group">
                            <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                                {user?.name?.charAt(0).toUpperCase()}
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                <div className="py-2">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 md:hidden overflow-hidden">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
