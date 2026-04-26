'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/utils/api';
import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';
import { useAlert } from '@/context/AlertContext';

export default function Register() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const getPasswordStrength = (password: string) => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    };

    const strength = getPasswordStrength(formData.password);
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthColors = ['bg-neutral-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    const passwordsMatch = formData.password === formData.confirmPassword;
    const isStrongEnough = strength >= 4;
    const canSubmit = !!(formData.email && isEmailValid(formData.email) && formData.password && formData.confirmPassword && passwordsMatch && isStrongEnough);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setError('');
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
            showAlert('Registration successful!', 'success');

            if (formData.role === 'psychologist') {
                router.push('/psychologist/onboarding');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(Array.isArray(msg) ? msg[0] : msg);
            showAlert(Array.isArray(msg) ? msg[0] : msg, 'error');
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
                    <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-accent-200 rounded-full blur-3xl opacity-20"></div>
                </div>

                <div className="w-full max-w-md relative z-10">
                    <div className="text-center mb-8 animate-fade-in-up">
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Account</h1>
                        <p className="text-neutral-600">Start your mental wellness journey today</p>
                    </div>

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
                                    placeholder="Full Name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

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
                                <div className="relative mb-2">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="input w-full pr-10"
                                        placeholder="At least 8 characters"
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

                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 h-1.5 mt-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`flex-1 rounded-full ${strength >= level ? strengthColors[strength] : 'bg-neutral-200'}`}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className={`text-xs font-medium ${strength >= 4 ? 'text-green-600' : strength >= 2 ? 'text-orange-500' : 'text-red-500'}`}>
                                                {strengthLabels[strength]}
                                            </p>
                                            {!isStrongEnough && formData.password && (
                                                <p className="text-[10px] text-neutral-400">Aim for Strong</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="label">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        className={`input w-full pr-10 ${formData.confirmPassword && !passwordsMatch ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="Re-enter your password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? (
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
                                {formData.confirmPassword && !passwordsMatch && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                                {formData.confirmPassword && passwordsMatch && (
                                    <p className="text-xs text-green-600 mt-1">Passwords match</p>
                                )}
                            </div>

                            <div className="flex items-start space-x-2">
                                <input
                                    type="checkbox"
                                    required
                                    className="w-4 h-4 mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label className="text-sm text-neutral-600">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !canSubmit}
                                className={`btn btn-primary w-full shadow-navy transition-all duration-300 ${!canSubmit ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="spinner mr-2"></span>
                                        Creating account...
                                    </span>
                                ) : emailError ? (
                                    'Invalid Email'
                                ) : !isStrongEnough && formData.password ? (
                                    'Weak Password'
                                ) : !passwordsMatch && formData.confirmPassword ? (
                                    'Passwords Must Match'
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center mt-6 text-neutral-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                            Sign in
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
