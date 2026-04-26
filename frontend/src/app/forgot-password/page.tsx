'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { verifyEmail, resetPassword } from '@/utils/api';
import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';
import { useAlert } from '@/context/AlertContext';

export default function ForgotPassword() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    // Email validation regex
    const isEmailValid = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const emailError = !!(email && !isEmailValid(email));

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

    const strength = getPasswordStrength(password);
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthColors = ['bg-neutral-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    const passwordsMatch = password === confirmPassword;
    const isStrongEnough = strength >= 4;
    const canSubmit = !!(password && confirmPassword && passwordsMatch && isStrongEnough);

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isEmailValid(email)) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await verifyEmail(email);
            setStatus('idle');
            setStep(2);
            showAlert('Email verified. Please set your new password.', 'success');
        } catch (err: any) {
            setStatus('error');
            const msg = err.response?.data?.message || 'Email not found.';
            setMessage(msg);
            showAlert(msg, 'error');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setStatus('loading');
        setMessage('');

        try {
            await resetPassword(email, currentPassword, password);
            setStatus('success');
            const msg = 'Your password has been successfully reset. You can now log in.';
            setMessage(msg);
            showAlert(msg, 'success');
        } catch (err: any) {
            setStatus('error');
            const msg = err.response?.data?.message || 'Failed to update password. Check your current password.';
            setMessage(msg);
            showAlert(msg, 'error');
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
                        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Change Password</h1>
                        <p className="text-neutral-600">{step === 1 ? 'Verify your email to continue' : 'Enter your current and new password'}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-soft-xl p-8 border border-neutral-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {status === 'success' ? (
                            <div className="text-center py-6 block">
                                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-neutral-800 mb-2">Password Updated!</h3>
                                <p className="text-neutral-600 text-sm mb-6">{message}</p>

                                <Link href="/login" className="btn btn-primary w-full shadow-navy">
                                    Go to Login
                                </Link>
                            </div>
                        ) : step === 1 ? (
                            <form onSubmit={handleVerifyEmail} className="space-y-6">
                                {status === 'error' && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {message}
                                    </div>
                                )}

                                <div>
                                    <label className="label">Registered Email</label>
                                    <input
                                        type="email"
                                        required
                                        className={`input w-full ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        placeholder="username@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {emailError && (
                                        <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading' || emailError}
                                    className={`btn btn-primary w-full shadow-navy transition-all duration-300 ${status === 'loading' || emailError ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                >
                                    {status === 'loading' ? (
                                        <span className="flex items-center justify-center">
                                            <span className="spinner mr-2"></span>
                                            Verifying...
                                        </span>
                                    ) : emailError ? (
                                        'Invalid Email'
                                    ) : (
                                        'Verify Email'
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                {status === 'error' && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {message}
                                    </div>
                                )}

                                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 mb-4 flex items-center justify-between">
                                    <span className="text-sm font-medium text-neutral-600">{email}</span>
                                    <button type="button" onClick={() => setStep(1)} className="text-xs text-primary-600 font-bold hover:underline">Change</button>
                                </div>

                                <div>
                                    <label className="label">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            required
                                            className="input w-full pr-10"
                                            placeholder="Enter current password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 focus:outline-none"
                                        >
                                            {showCurrentPassword ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">New Password</label>
                                    <div className="relative mb-2">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            className="input w-full pr-10"
                                            placeholder="At least 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 focus:outline-none"
                                        >
                                            {showNewPassword ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {password && (
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
                                                {!isStrongEnough && password && (
                                                    <p className="text-[10px] text-neutral-400">Aim for Strong</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="label">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            required
                                            className={`input w-full pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 focus:outline-none"
                                        >
                                            {showConfirmNewPassword ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                    )}
                                    {confirmPassword && passwordsMatch && (
                                        <p className="text-xs text-green-600 mt-1">Passwords match</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={!!(status === 'loading' || emailError || !canSubmit)}
                                    className={`btn btn-primary w-full shadow-navy transition-all duration-300 ${status === 'loading' || emailError || !canSubmit ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                >
                                    {status === 'loading' ? (
                                        <span className="flex items-center justify-center">
                                            <span className="spinner mr-2"></span>
                                            Saving...
                                        </span>
                                    ) : emailError ? (
                                        'Invalid Email'
                                    ) : !isStrongEnough && password ? (
                                        'Weak Password'
                                    ) : !passwordsMatch && confirmPassword ? (
                                        'Passwords Must Match'
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {status !== 'success' && (
                        <div className="text-center mt-6">
                            <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-700 inline-flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Back to login</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
