import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden animate-slide-in`}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="btn-icon text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar max-h-[calc(90vh-100px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
