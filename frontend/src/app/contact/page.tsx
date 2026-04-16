'use client';

import { useState, useEffect } from 'react';
import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';
import { sendContactMessage } from '@/utils/api';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            await sendContactMessage(formData);
            setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
            setFormData({ fullName: '', email: '', subject: '', message: '' });
        } catch (error: any) {
            console.error('Error sending message:', error);

            // Format error message - handle NestJS validation arrays or single strings
            const backendMessage = error.response?.data?.message;
            let formattedMessage = 'Failed to send message. Please try again.';

            if (Array.isArray(backendMessage)) {
                formattedMessage = backendMessage[0]; // Take first readable error
            } else if (typeof backendMessage === 'string') {
                formattedMessage = backendMessage;
            }

            setStatus({ type: 'error', message: formattedMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-dismiss after 10 seconds
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setStatus(null);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />

            <main className="pt-24 lg:pt-32 pb-12 lg:pb-20">
                <div className="container-custom mx-auto px-4">
                    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
                        <div className="w-full lg:w-[40%] text-center lg:text-left">
                            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 mb-6 tracking-tight">Get in Touch</h1>
                            <p className="text-lg md:text-xl text-neutral-600 mb-10 leading-relaxed">
                                Have questions about our AI stress analysis or need technical support? Our team is here to help you achieve peace of mind. Just send us a message and we will get back to you as soon as possible.
                            </p>

                            <div className="space-y-6 md:space-y-10 mb-12 lg:mb-0">
                                <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">📧</div>
                                    <div className="text-center sm:text-left">
                                        <div className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest">Support Email</div>
                                        <div className="text-lg md:text-xl font-bold text-neutral-900 break-all sm:break-normal">stressawaysupport@gmail.com</div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                                    <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center text-3xl">📍</div>
                                    <div className="text-center sm:text-left">
                                        <div className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest">Office Location</div>
                                        <div className="text-lg md:text-xl font-bold text-neutral-900">Superior University, Lahore</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-[60%] w-full bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl border border-neutral-100">
                            {status && (
                                <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    <div className="flex items-center">
                                        <span className="mr-2 text-xl">{status.type === 'success' ? '✅' : '❌'}</span>
                                        <span>{status.message}</span>
                                    </div>
                                    <button
                                        onClick={() => setStatus(null)}
                                        className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors"
                                        aria-label="Close"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-neutral-700 ml-1">Full Name</label>
                                        <input
                                            name="fullName"
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-primary-600 focus:bg-white transition-all outline-none"
                                            placeholder="Abdul Haseeb"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-neutral-700 ml-1">Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-primary-600 focus:bg-white transition-all outline-none"
                                            placeholder="haseeb@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-700 ml-1">Subject</label>
                                    <input
                                        name="subject"
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-primary-600 focus:bg-white transition-all outline-none"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-neutral-700 ml-1">Message</label>
                                    <textarea
                                        name="message"
                                        rows={4}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-primary-600 focus:bg-white transition-all outline-none resize-none"
                                        placeholder="Tell us more..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
