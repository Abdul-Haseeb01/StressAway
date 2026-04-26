'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/utils/api';
import { useAlert } from '@/context/AlertContext';
import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';

export default function Login() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Email validation regex
    const isEmailValid = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const emailError = !!(formData.email && !isEmailValid(formData.email));

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isEmailValid(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);

            if (rememberMe) {
                localStorage.setItem('token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
            } else {
                sessionStorage.setItem('token', response.access_token);
                sessionStorage.setItem('user', JSON.stringify(response.user));
            }

            showAlert('Successfully logged in!', 'success');

            // Redirect based on role
            if (response.user.role === 'admin' || response.user.role === 'super_admin') {
                router.push('/admin');
            } else if (response.user.role === 'psychologist') {
                router.push('/psychologist');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            let msg = err.response?.data?.message || 'Login failed. Please try again.';

            if (Array.isArray(msg)) {
                msg = msg[0];
            }

            if (typeof msg === 'string' && msg.toLowerCase().includes('email must be an email')) {
                msg = 'Enter correct email';
            }

            setError(msg);
            showAlert(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <AdaptiveNavbar />
            
            <div className="h-20 flex-shrink-0"></div>

            <div className="flex-grow flex items-center justify-center p-4 py-12 bg-gradient-to-br from-primary-50 via-white to-accent-50 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full blur-3xl opacity-20"></div>
                </div>

                <div className="w-full max-w-md relative z-10">
                    <div className="text-center mb-8 animate-fade-in-up">
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
                        <p className="text-neutral-600">Sign in to continue your wellness journey</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-neutral-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className={`input w-full ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="username@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                {emailError && (
                                    <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                                )}
                            </div>

                            <div>
                                <label className="label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="input w-full pr-10"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-neutral-600">Remember me</span>
                                </label>
                                <Link href="/forgot-password" title="reset password" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || emailError}
                                className={`btn btn-primary w-full shadow-navy transition-all duration-300 ${loading || emailError ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="spinner mr-2"></span>
                                        Signing in...
                                    </span>
                                ) : emailError ? (
                                    'Invalid Email'
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center mt-6 text-neutral-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Don't have an account?{' '}
                        <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                            Sign up for free
                        </Link>
                    </p>

                    <div className="text-center mt-4">
                        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-700 inline-flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to home</span>
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
