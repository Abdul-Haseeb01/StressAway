'use client';

import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />

            <main className="pt-32 pb-20">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h1 className="text-6xl font-black text-neutral-900 mb-6 tracking-tight">Our Story</h1>
                            <p className="text-xl text-neutral-600 leading-relaxed">
                                StressAway was born from a simple yet powerful mission: to make high-quality mental wellness tools accessible to everyone, everywhere, using the power of AI.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 mb-20">
                            <div className="bg-primary-50 p-10 rounded-[3rem] border border-primary-100">
                                <div className="text-4xl mb-4">🚀</div>
                                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Our Vision</h3>
                                <p className="text-neutral-700 leading-relaxed">
                                    We envision a world where mental health is prioritized as much as physical health, and where technology serves as a compassionate bridge between individuals and well-being.
                                </p>
                            </div>
                            <div className="bg-violet-50 p-10 rounded-[3rem] border border-violet-100">
                                <div className="text-4xl mb-4">🔬</div>
                                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Our Tech</h3>
                                <p className="text-neutral-700 leading-relaxed">
                                    By leveraging state-of-the-art Facial Emotion Recognition and Large Language Models, we provide objective insights into stress patterns that were previously invisible.
                                </p>
                            </div>
                        </div>

                        <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed space-y-8 text-lg">
                            <h2 className="text-3xl font-black text-neutral-900">Why StressAway?</h2>
                            <p>
                                In today's fast-paced world, stress is often overlooked until it becomes a crisis. StressAway provides the early-warning system
                                needed to catch stress before it escalates. Our combination of scientific questionnaires, AI analysis, and community connection
                                creates a unique ecosystem of support.
                            </p>
                            <p>
                                Whether you are a student facing exam pressure, a professional dealing with burnout, or someone looking to maintain their
                                mental peace, StressAway is designed to grow with you.
                            </p>
                        </div>

                        {/* <div className="mt-20 p-12 bg-neutral-900 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl">
                            <div className="mb-8 md:mb-0 md:mr-8 text-center md:text-left">
                                <h2 className="text-3xl font-bold mb-2">Ready to prioritize yourself?</h2>
                                <p className="opacity-70">Join thousands of users on their journey to peace.</p>
                            </div>
                            <a href="/register" className="px-10 py-5 bg-white text-neutral-900 rounded-2xl font-black text-xl hover:bg-primary-50 transition-colors whitespace-nowrap">
                                Get Started Free
                            </a>
                        </div> */}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
