'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/utils/api';
import { useAlert } from '@/context/AlertContext';

export default function Login() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));

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

            // Backend validation often returns an array of messages
            if (Array.isArray(msg)) {
                msg = msg[0]; // Take the first validation error
            }

            // Override the raw class-validator email message
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full blur-3xl opacity-20"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo and Header */}
                <div className="text-center mb-8 animate-fade-in-up">
                    <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-6">
                        <div className="w-12 h-12 bg-navy-gradient rounded-xl flex items-center justify-center shadow-navy">
                            <span className="text-white text-2xl font-bold">S</span>
                        </div>
                        <span className="text-3xl font-bold text-primary-900">StressAway</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
                    <p className="text-neutral-600">Sign in to continue your wellness journey</p>
                </div>

                {/* Login Card */}
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
                                className="input"
                                placeholder="your.email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            {/* <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                <span className="text-neutral-600">Remember me</span>
                            </label> */}
                            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full shadow-navy"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="spinner mr-2"></span>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Sign Up Link */}
                <p className="text-center mt-6 text-neutral-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Don't have an account?{' '}
                    <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                        Sign up for free
                    </Link>
                </p>

                {/* Back to Home */}
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
    );
}
