import React, { useState } from 'react';

// Google Logo SVG
const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

const GoogleButton = ({
    onClick,
    loading = false,
    text = 'Continue with Google',
    className = '',
    disabled = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading || disabled}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                w-full flex items-center justify-center gap-3 
                px-4 py-3 
                border border-gray-300 dark:border-gray-600 
                rounded-lg 
                bg-white dark:bg-gray-800
                text-gray-700 dark:text-gray-200 
                font-medium 
                transition-all duration-200
                hover:bg-gray-50 dark:hover:bg-gray-700
                hover:border-gray-400 dark:hover:border-gray-500
                hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
            style={{
                transform: isHovered && !loading && !disabled ? 'translateY(-1px)' : 'none',
            }}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
                <GoogleLogo />
            )}
            <span>{loading ? 'Signing in...' : text}</span>
        </button>
    );
};

// Divider component for "or" separator
export const AuthDivider = ({ text = 'or' }) => (
    <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {text}
            </span>
        </div>
    </div>
);

export default GoogleButton;
