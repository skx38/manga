'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PreferencesContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
    adultFilter: boolean;
    toggleAdultFilter: () => void;
    focusMode: boolean;
    toggleFocusMode: () => void;
    isGuest: boolean;
    toggleGuestMode: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    // Default states
    const [darkMode, setDarkMode] = useState(true);
    const [adultFilter, setAdultFilter] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedDarkMode = localStorage.getItem('omni_darkMode');
        const savedAdultFilter = localStorage.getItem('omni_adultFilter');
        const savedFocusMode = localStorage.getItem('omni_focusMode');
        const savedIsGuest = localStorage.getItem('omni_isGuest');

        if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
        if (savedAdultFilter !== null) setAdultFilter(savedAdultFilter === 'true');
        if (savedFocusMode !== null) setFocusMode(savedFocusMode === 'true');
        if (savedIsGuest !== null) setIsGuest(savedIsGuest === 'true');

        setMounted(true);
    }, []);

    // Apply Dark Mode to HTML element
    useEffect(() => {
        if (mounted) {
            const root = window.document.documentElement;
            if (darkMode) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            localStorage.setItem('omni_darkMode', String(darkMode));
        }
    }, [darkMode, mounted]);

    // Persist other states
    useEffect(() => {
        if (mounted) localStorage.setItem('omni_adultFilter', String(adultFilter));
    }, [adultFilter, mounted]);

    useEffect(() => {
        if (mounted) localStorage.setItem('omni_focusMode', String(focusMode));
    }, [focusMode, mounted]);

    useEffect(() => {
        if (mounted) localStorage.setItem('omni_isGuest', String(isGuest));
    }, [isGuest, mounted]);

    const toggleDarkMode = () => setDarkMode(prev => !prev);
    const toggleAdultFilter = () => setAdultFilter(prev => !prev);
    const toggleFocusMode = () => setFocusMode(prev => !prev);
    const toggleGuestMode = () => {
        if (!isGuest) {
            // Logging out
            setIsGuest(true);
            // Optional: Clear other user data if needed, but for demo we keep prefs
        } else {
            // Logging in
            setIsGuest(false);
        }
        // Force reload to reset any other user-specific state if needed
        setTimeout(() => window.location.reload(), 100);
    };

    // Prevent hydration mismatch by rendering children only after mount, 
    // or accept that initial render might differ. 
    // For theme, it's better to render immediately but maybe with a flash.
    // To avoid flash, we usually use a script in head, but for this app, 
    // we'll just accept a potential quick flicker or default to dark.

    return (
        <PreferencesContext.Provider value={{
            darkMode, toggleDarkMode,
            adultFilter, toggleAdultFilter,
            focusMode, toggleFocusMode,
            isGuest, toggleGuestMode
        }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}
