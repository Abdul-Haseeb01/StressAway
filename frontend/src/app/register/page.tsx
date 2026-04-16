
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/utils/api';

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await register({
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4 py-12">
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
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
                    <p className="text-neutral-600">Start your mental wellness journey today</p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-neutral-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                required
                                className="input"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

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
                            <label className="label">Account Type</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'user' })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'user'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">👤</div>
                                    <div className="font-semibold text-sm">User</div>
                                    <div className="text-xs text-neutral-600">Seeking support</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'psychologist' })}
                                    className={`p-4 rounded-lg border-2 transition-all ${formData.role === 'psychologist'
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">👨‍⚕️</div>
                                    <div className="font-semibold text-sm">Psychologist</div>
                                    <div className="text-xs text-neutral-600">Providing care</div>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="At least 6 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="Re-enter your password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <div className="flex items-start space-x-2">
                            <input
                                type="checkbox"
                                required
                                className="w-4 h-4 mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label className="text-sm text-neutral-600">
                                I agree to the{' '}
                                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full shadow-navy"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="spinner mr-2"></span>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                </div>

                {/* Sign In Link */}
                <p className="text-center mt-6 text-neutral-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                        Sign in
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
