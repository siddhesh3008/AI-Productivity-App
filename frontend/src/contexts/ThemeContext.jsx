import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState('light');

    // Apply theme to document
    const applyTheme = (themeValue) => {
        let effectiveTheme = themeValue;
        if (themeValue === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
        }

        if (effectiveTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        // Check saved theme or default to system
        const savedTheme = localStorage.getItem('theme') || 'system';
        setThemeState(savedTheme);
        applyTheme(savedTheme);

        // Listen for system theme changes when in system mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const currentTheme = localStorage.getItem('theme') || 'system';
            if (currentTheme === 'system') {
                applyTheme('system');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // Calculate effective isDark based on current theme or system preference
    const getIsDark = () => {
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme === 'dark';
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: getIsDark(),
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
