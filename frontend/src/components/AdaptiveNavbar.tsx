'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Navbar from './Navbar';

export default function SharedNavbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            setIsLoggedIn(!!token);
        };
        
        checkAuth();
        // Listen for storage changes in case of logout in other tabs
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    if (!mounted) return null; // Prevent hydration mismatch

    return isLoggedIn ? <Header /> : <Navbar />;
}
