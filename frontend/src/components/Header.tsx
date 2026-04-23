
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getProfile, getConnections, getFamilyConnections } from '@/utils/api';
import { getStoredToken, getStoredUser, clearStorage, updateStoredUser } from '@/utils/storage';

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [pendingFamily, setPendingFamily] = useState(0);
    const [pendingPsych, setPendingPsych] = useState(0);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuOpen && !(event.target as Element).closest('.profile-dropdown')) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [profileMenuOpen]);

    useEffect(() => {
        const loadUserFromStorage = () => {
            const userData = getStoredUser();
            setUser(userData);
        };

        const fetchLatestProfile = async () => {
            try {
                const token = getStoredToken();
                if (!token) return;

                const data = await getProfile();
                const profile = data.profile || {};

                const currentUser = getStoredUser() || {};

                const updatedUser = {
                    ...currentUser,
                    id: data.id || currentUser.id,
                    email: data.email || currentUser.email,
                    role: data.role || currentUser.role,
                    full_name: profile.full_name || currentUser.full_name,
                    avatar_url: profile.avatar_url || currentUser.avatar_url,
                };

                updateStoredUser(updatedUser);
                setUser(updatedUser);
            } catch (error) {
                console.error("Header profile fetch error:", error);
            }
        };

        // 1. Initial synchronous load for instant render
        loadUserFromStorage();

        // 2. Background fetch to guarantee latest avatar is loaded
        fetchLatestProfile();

        // 3. Listen for custom profile update events
        window.addEventListener('userProfileUpdated', loadUserFromStorage);

        // 4. Periodic background check for role/status changes (30 seconds)
        const sessionInterval = setInterval(() => {
            const token = getStoredToken();
            if (token && window.location.pathname !== '/login') {
                getProfile().catch(() => {
                    // The 401 Error Interceptor in api.ts will handle the logout and alert
                });
            }
        }, 30000);

        // 5. Initial notifications fetch
        const token = getStoredToken();
        if (token) fetchNotifications();

        return () => {
            window.removeEventListener('userProfileUpdated', loadUserFromStorage);
            clearInterval(sessionInterval);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const u = getStoredUser();
            if (!u) return;

            const [fam, psych] = await Promise.all([
                getFamilyConnections(),
                getConnections()
            ]);

            // Family: incoming pending
            const pf = Array.isArray(fam) ? fam.filter((c: any) => c.status === 'pending' && c.is_incoming).length : 0;
            setPendingFamily(pf);

            // Psych: incoming pending (Psychologists don't usually send requests to users, but handled for consistency)
            const pp = Array.isArray(psych) ? psych.filter((c: any) => c.status === 'pending' && c.connected_user_id === u.id).length : 0;
            setPendingPsych(pp);
        } catch { }
    };

    // Re-fetch when pathname changes to update dots
    useEffect(() => {
        const token = getStoredToken();
        if (token) fetchNotifications();
    }, [pathname]);

    // Proactively verify the session EVERY time the user navigates to a new page
    // This catches role/status changes immediately on Next.js SPA transitions
    useEffect(() => {
        const token = getStoredToken();
        if (token && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
            getProfile()
                .then(data => {
                    const profile = data.profile || {};
                    const currentUser = getStoredUser() || {};

                    // Optionally update the local user info if it changed
                    if (data.role !== currentUser.role || data.id !== currentUser.id) {
                        const updatedUser = {
                            ...currentUser,
                            id: data.id,
                            email: data.email,
                            role: data.role,
                            full_name: profile.full_name || currentUser.full_name,
                            avatar_url: profile.avatar_url || currentUser.avatar_url,
                        };

                        updateStoredUser(updatedUser);
                        setUser(updatedUser);
                    }
                })
                .catch(() => {
                    // API 401 interceptor handles the silent failure
                });
        }
    }, [pathname]);

    const handleLogout = () => {
        clearStorage();
        router.push('/');
    };

    const isActive = (path: string) => pathname === path;

    const getLogoLink = () => {
        if (!user) return '/';
        if (user.role === 'admin' || user.role === 'super_admin') return '/admin';
        if (user.role === 'psychologist') return '/psychologist';
        return '/dashboard';
    };

    return (
        <header className="fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href={getLogoLink()} className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-10 h-10 bg-navy-gradient rounded-lg flex items-center justify-center shadow-navy">
                            <span className="text-white text-xl font-bold">S</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-primary-900">StressAway</span>
                    </Link>

                    {/* Desktop Navigation */}
                    {user ? (
                        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
                            {(user.role === 'admin' || user.role === 'super_admin') && (
                                <Link
                                    href="/admin"
                                    className={`font-medium transition-colors text-sm lg:text-base ${isActive('/admin') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                >
                                    Admin Console
                                </Link>
                            )}

                            {user.role === 'psychologist' && (
                                <Link
                                    href="/psychologist"
                                    className={`font-medium transition-colors text-sm lg:text-base ${isActive('/psychologist') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                >
                                    Clinical Dashboard
                                </Link>
                            )}

                            {(!user.role || user.role === 'user') && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className={`font-medium transition-colors text-sm lg:text-base ${isActive('/dashboard') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/questionnaire"
                                        className={`font-medium transition-colors text-sm lg:text-base ${isActive('/questionnaire') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Questionnaire
                                    </Link>
                                    <Link
                                        href="/facial-emotion"
                                        className={`font-medium transition-colors text-sm lg:text-base ${isActive('/facial-emotion') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Facial Scan
                                    </Link>
                                    <Link
                                        href="/chatbot"
                                        className={`font-medium transition-colors text-sm lg:text-base ${isActive('/chatbot') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Chatbot
                                    </Link>
                                    <Link
                                        href="/wellness"
                                        className={`font-medium transition-colors text-sm lg:text-base ${isActive('/wellness') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Wellness
                                    </Link>

                                    <Link
                                        href="/family"
                                        className={`font-medium transition-colors text-sm lg:text-base flex items-center gap-1 ${isActive('/family') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Family
                                    </Link>
                                    <Link
                                        href="/psychologists"
                                        className={`font-medium transition-colors text-sm lg:text-base flex items-center gap-1 ${isActive('/psychologists') ? 'text-primary-800' : 'text-neutral-600 hover:text-primary-800'}`}
                                    >
                                        Psychologists
                                    </Link>
                                    <Link
                                        href="/sos"
                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                    >
                                        SOS
                                    </Link>
                                </>
                            )}

                            {/* Profile Dropdown */}
                            <div className="relative profile-dropdown">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full border-2 border-primary-200 overflow-hidden bg-neutral-100 flex items-center justify-center hover:border-primary-500 transition-colors">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-neutral-400 text-xl">👤</span>
                                        )}
                                    </div>
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-neutral-100 mb-1">
                                            <p className="text-sm font-medium text-neutral-900 truncate">
                                                {user?.full_name || 'User'}
                                            </p>
                                            <p className="text-xs text-neutral-500 truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-700 transition-colors"
                                        >
                                            Personal Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </nav>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            <Link href="/login" className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium text-sm">
                                Sign In
                            </Link>
                            <Link href="/register" className="px-4 py-2 bg-navy-gradient text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm shadow-navy">
                                Get Started
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-neutral-200 bg-white">
                        {user ? (
                            <nav className="flex flex-col space-y-2">
                                {user.role === 'admin' && (
                                    <Link href="/admin" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Admin Console</Link>
                                )}
                                {user.role === 'psychologist' && (
                                    <Link href="/psychologist" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Clinical Dashboard</Link>
                                )}
                                {(!user.role || user.role === 'user') && (
                                    <>
                                        <Link href="/dashboard" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Dashboard</Link>
                                        <Link href="/questionnaire" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Questionnaire</Link>
                                        <Link href="/facial-emotion" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Facial Scan</Link>
                                        <Link href="/chatbot" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Chatbot</Link>
                                        <Link href="/wellness" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Wellness</Link>
                                        <Link href="/family" className="px-4 py-2 rounded-lg hover:bg-neutral-100 font-medium">Family</Link>
                                        <Link href="/psychologists" className="px-4 py-2 rounded-lg hover:bg-neutral-100">Psychologists</Link>
                                        <Link href="/sos" className="mx-4 my-2 px-4 py-2 bg-red-600 text-white text-center rounded-lg">SOS</Link>
                                    </>
                                )}
                                <div className="border-t border-neutral-200 my-2 pt-2">
                                    <Link href="/profile" className="block px-4 py-2 rounded-lg hover:bg-neutral-100">Personal Profile</Link>
                                    <button onClick={handleLogout} className="w-full px-4 py-2 text-left rounded-lg text-red-600 hover:bg-red-50">Logout</button>
                                </div>
                            </nav>
                        ) : (
                            <div className="flex flex-col space-y-2">
                                <Link href="/login" className="px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg text-center">Sign In</Link>
                                <Link href="/register" className="px-4 py-2 bg-navy-gradient text-white rounded-lg text-center shadow-navy">Get Started</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}

