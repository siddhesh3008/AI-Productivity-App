import React from 'react';

const Input = ({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    className={`input-field ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''
                        }`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default Input;
