'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { verifyEmail, resetPassword } from '@/utils/api';

export default function ForgotPassword() {
    const router = useRouter();
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

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await verifyEmail(email);
            setStatus('idle');
            setStep(2);
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Email not found.');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('New passwords do not match');
            return;
        }

        if (password.length < 8) {
            setStatus('error');
            setMessage('Password must be at least 8 characters');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await resetPassword(email, currentPassword, password);
            setStatus('success');
            setMessage('Your password has been successfully reset. You can now log in.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to update password. Check your current password.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200 rounded-full blur-3xl opacity-20"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 animate-fade-in-up">
                    <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-6">
                        <div className="w-12 h-12 bg-navy-gradient rounded-xl flex items-center justify-center shadow-navy">
                            <span className="text-white text-2xl font-bold">S</span>
                        </div>
                        <span className="text-3xl font-bold text-primary-900">StressAway</span>
                    </Link>
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
                                    className="input"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn btn-primary w-full shadow-navy"
                            >
                                {status === 'loading' ? (
                                    <span className="flex items-center justify-center">
                                        <span className="spinner mr-2"></span>
                                        Verifying...
                                    </span>
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
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label">New Password</label>
                                <div className="relative">
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
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        required
                                        className="input w-full pr-10"
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
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn btn-primary w-full shadow-navy"
                            >
                                {status === 'loading' ? (
                                    <span className="flex items-center justify-center">
                                        <span className="spinner mr-2"></span>
                                        Saving...
                                    </span>
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
    );
}
