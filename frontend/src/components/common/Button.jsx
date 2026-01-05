import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    type = 'button',
    onClick,
    disabled = false,
    loading = false,
    className = '',
    icon: Icon,
    ...props
}) => {
    const baseClasses = 'font-medium px-6 py-2.5 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Loading...
                </>
            ) : (
                <>
                    {Icon && <Icon className="w-5 h-5" />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
