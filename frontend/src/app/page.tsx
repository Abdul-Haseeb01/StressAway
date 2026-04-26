'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Logo from '@/components/Logo';

const featureDeck = [
    {
        icon: '📋',
        title: 'Stress Questionnaire',
        desc: 'Take validated psychological assessments to measure your stress levels scientifically.',
        color: 'bg-blue-50',
        textColor: 'text-blue-600'
    },
    {
        icon: '🤳',
        title: 'Facial Analysis',
        desc: 'AI emotion detection analyzes your facial expressions for objective stress insights.',
        color: 'bg-violet-50',
        textColor: 'text-violet-600'
    },
    {
        icon: '🤖',
        title: 'AI Wellness Chat',
        desc: '24/7 intelligent companion providing wellness guidance and coping strategies.',
        color: 'bg-green-50',
        textColor: 'text-green-600'
    },
    {
        icon: '📊',
        title: 'Stress Trends',
        desc: 'Visualize your progress with interactive charts and detailed statistical analysis.',
        color: 'bg-indigo-50',
        textColor: 'text-indigo-600'
    },
    {
        icon: '🧘',
        title: 'Wellness Activities',
        desc: 'Personalized breathing exercises and relaxation tasks tailored for you.',
        color: 'bg-teal-50',
        textColor: 'text-teal-600'
    },
    {
        icon: '👪',
        title: 'Family Network',
        desc: 'Connect with loved ones and build a real-time support system.',
        color: 'bg-orange-50',
        textColor: 'text-orange-600'
    },
    {
        icon: '🆘',
        title: 'Emergency SOS',
        desc: 'Instant crisis notifications to your contacts and professionals when help is needed.',
        color: 'bg-red-50',
        textColor: 'text-red-600'
    },
];

export default function Home() {
    const router = useRouter();
    const [deckIndex, setDeckIndex] = useState(0);

    const nextCard = () => {
        setDeckIndex((prev) => (prev + 1) % featureDeck.length);
    };

    useEffect(() => {
        const timer = setInterval(nextCard, 4000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />

            {/* Hero Section */}
            <section className="pt-24 pb-12 bg-gradient-to-br from-primary-50 via-white to-accent-50">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-fade-in-up">
                            {/* <div className="inline-block px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold mb-6 shadow-sm">
                                🎯 AI-Powered Mental Wellness Platform
                            </div> */}
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 leading-tight">
                                Take Control of Your
                                <span className="block mt-2 bg-gradient-to-r from-primary-800 to-primary-600 bg-clip-text text-transparent">Mental Health</span>
                            </h1>
                            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                                Monitor stress levels, access professional support, and improve your well-being with our comprehensive mental wellness platform powered by AI.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register" className="btn btn-primary btn-lg shadow-navy hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                    Start Your Journey
                                </Link>
                                <Link href="/login" className="btn btn-white btn-lg hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                                    Sign In
                                </Link>
                            </div>
                            <div className="mt-8 flex items-center space-x-6 text-sm text-neutral-600">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Free to use</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>100% Private</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>24/7 Support</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative group h-full min-h-[500px] hidden lg:flex items-center justify-center">
                            {/* Horizontal Focused Carousel */}
                            <div className="relative w-full h-[480px] flex items-center justify-center overflow-hidden">
                                {featureDeck.map((feature, i) => {
                                    // Calculate relative position to deckIndex
                                    let diff = i - deckIndex;
                                    // Adjust for wrap-around
                                    if (diff > Math.floor(featureDeck.length / 2)) diff -= featureDeck.length;
                                    if (diff < -Math.floor(featureDeck.length / 2)) diff += featureDeck.length;

                                    const isActive = diff === 0;
                                    const isPrev = diff === -1;
                                    const isNext = diff === 1;
                                    const isLeftFar = diff < -1;
                                    const isRightFar = diff > 1;

                                    // Appearance logic
                                    let opacity = 0;
                                    let scale = 0.8;
                                    let xOffset = 0;
                                    let zIndex = 10;
                                    let filter = 'blur(4px)';

                                    if (isActive) {
                                        opacity = 1;
                                        scale = 1;
                                        xOffset = 0;
                                        zIndex = 30;
                                        filter = 'blur(0px)';
                                    } else if (isPrev) {
                                        opacity = 0.6;
                                        scale = 0.85;
                                        xOffset = -140;
                                        zIndex = 20;
                                    } else if (isNext) {
                                        opacity = 0.6;
                                        scale = 0.85;
                                        xOffset = 140;
                                        zIndex = 20;
                                    } else if (isLeftFar) {
                                        opacity = 0;
                                        xOffset = -250;
                                    } else if (isRightFar) {
                                        opacity = 0;
                                        xOffset = 250;
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`absolute w-[280px] h-[420px] rounded-[2rem] transition-all duration-700 ease-out overflow-hidden shadow-2xl
                                                ${isActive ? 'bg-neutral-900 ring-4 ring-primary-500/20' : 'bg-white border border-neutral-100'}`}
                                            style={{
                                                opacity,
                                                zIndex,
                                                transform: `translateX(${xOffset}px) scale(${scale})`,
                                                filter,
                                            }}
                                        >
                                            <div className="h-2/5 flex items-center justify-center relative bg-gradient-to-br from-primary-50 to-white overflow-hidden">
                                                <div className={`text-6xl transition-transform duration-700 ${isActive ? 'scale-110 rotate-3' : 'scale-90 opacity-60'}`}>
                                                    {feature.icon}
                                                </div>
                                                {isActive && (
                                                    <div className="absolute inset-0 bg-primary-500/5 animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="h-3/5 p-8 flex flex-col items-center text-center">
                                                <h3 className={`text-2xl font-black mb-4 transition-colors duration-500 ${isActive ? 'text-white' : 'text-neutral-800'}`}>
                                                    {feature.title}
                                                </h3>
                                                <p className={`text-sm leading-relaxed transition-colors duration-500 ${isActive ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                    {feature.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* UI Navigation */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeckIndex((prev) => (prev - 1 + featureDeck.length) % featureDeck.length); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-white/80 backdrop-blur rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors group"
                                >
                                    <svg className="w-6 h-6 text-neutral-800 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); nextCard(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-white/80 backdrop-blur rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors group"
                                >
                                    <svg className="w-6 h-6 text-neutral-800 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            {/* Refined Background Blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400 rounded-full blur-[120px] opacity-20 -z-10"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-primary-100 rounded-full opacity-30 -z-10 animate-spin-slow"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-10 bg-navy-gradient">
                <div className="container-custom">
                    <div className="grid md:grid-cols-4 gap-8 text-center text-white">
                        <div className="animate-fade-in-up">
                            <div className="text-4xl font-bold mb-2">100</div>
                            <div className="text-white/80">Active Users</div>
                        </div>
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="text-4xl font-bold mb-2">10+</div>
                            <div className="text-white/80">Psychologists</div>
                        </div>
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="text-4xl font-bold mb-2">24/7</div>
                            <div className="text-white/80">AI Support</div>
                        </div>
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <div className="text-4xl font-bold mb-2">100%</div>
                            <div className="text-white/80">Private & Secure</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-12 bg-white scroll-mt-24">
                <div className="container-custom">
                    <div className="text-center mb-10">
                        <h2 className="section-title">Comprehensive Mental Wellness Tools</h2>
                        <p className="section-subtitle">
                            Everything you need to monitor, manage, and improve your mental health in one platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '📋',
                                title: 'Stress Questionnaire',
                                description: 'Take validated psychological assessments to measure your stress levels with scientifically-backed questionnaires.',
                                color: 'primary'
                            },
                            {
                                icon: '🤳',
                                title: 'Facial Emotion Recognition',
                                description: 'AI-powered emotion detection through facial expressions provides objective insights into your emotional state.',
                                color: 'secondary'
                            },
                            {
                                icon: '📊',
                                title: 'Advanced Analytics',
                                description: 'Visualize your stress trends over time with interactive charts and detailed statistical analysis.',
                                color: 'accent'
                            },
                            {
                                icon: '🤖',
                                title: 'AI Wellness Chatbot',
                                description: '24/7 access to an intelligent chatbot that provides mental wellness guidance and coping strategies.',
                                color: 'primary'
                            },
                            {
                                icon: '🧘',
                                title: 'Wellness Activities',
                                description: 'Access guided meditation, breathing exercises, and personalized wellness activities tailored to your needs.',
                                color: 'secondary'
                            },
                            {
                                icon: '👪',
                                title: 'Professional Network',
                                description: 'Connect with licensed psychologists and family members.',
                                color: 'accent'
                            },
                            {
                                icon: '🆘',
                                title: 'Emergency SOS',
                                description: 'Quick access to crisis support with instant notifications to your emergency contacts and mental health professionals.',
                                color: 'primary'
                            },
                            {
                                icon: '🔒',
                                title: 'Privacy First',
                                description: 'Your data is encrypted and never shared. We prioritize your privacy and confidentiality above all else.',
                                color: 'secondary'
                            },
                            {
                                icon: '📱',
                                title: 'Mobile Responsive',
                                description: 'Access all features seamlessly across desktop, tablet, and mobile devices with our responsive design.',
                                color: 'accent'
                            },
                        ].map((feature, index) => (
                            <div key={index} className="feature-card group shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-neutral-100" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <span className="text-3xl">{feature.icon}</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-neutral-900">{feature.title}</h3>
                                <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-12 bg-gradient-to-b from-primary-50 to-white scroll-mt-24">
                <div className="container-custom">
                    <div className="text-center mb-10">
                        <h2 className="section-title">How StressAway Works</h2>
                        <p className="section-subtitle">
                            Simple, effective, and scientifically-backed approach to mental wellness
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {[
                            {
                                step: '01',
                                title: 'Create Your Account',
                                description: 'Sign up for free in less than a minute. No credit card required. Choose your role as a user or mental health professional.',
                                icon: '🧔'
                            },
                            {
                                step: '02',
                                title: 'Assess Your Stress',
                                description: 'Take our comprehensive questionnaire or use facial emotion recognition to get an accurate baseline of your current stress levels.',
                                icon: '📋'
                            },
                            {
                                step: '03',
                                title: 'Get Personalized Support',
                                description: 'Receive tailored wellness activities, connect with professionals, and track your progress with detailed analytics and insights.',
                                icon: '🎯'
                            },
                        ].map((step, index) => (
                            <div key={index} className="relative h-full">
                                <div className="bg-white rounded-[2.5rem] p-10 shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-neutral-100 hover:-translate-y-1 overflow-visible">
                                    <div className="flex flex-col mb-6">
                                        <div className="text-4xl mb-4">{step.icon}</div>
                                        <div className="text-sm font-black uppercase tracking-[0.2em] text-primary-600">Step {step.step}</div>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4 text-neutral-900">{step.title}</h3>
                                    <p className="text-neutral-500 leading-relaxed flex-1 text-lg">{step.description}</p>
                                </div>
                                {index < 2 && (
                                    <div className="hidden lg:flex absolute top-1/2 -right-[36px] transform -translate-y-1/2 z-10 w-7 h-7 bg-white rounded-full shadow-md items-center justify-center border border-neutral-100 ring-4 ring-primary-50">
                                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-12 bg-white scroll-mt-24">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6 text-neutral-900">About StressAway</h2>
                            <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                                StressAway is a comprehensive mental wellness platform designed to help individuals monitor, manage, and improve their mental health through evidence-based assessments and AI-powered tools.
                            </p>
                            <p className="text-lg text-neutral-600 mb-6 leading-relaxed">
                                Our platform combines validated psychological questionnaires with cutting-edge facial emotion recognition technology to provide accurate, objective insights into your stress levels and emotional well-being.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <svg className="w-6 h-6 text-primary-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Evidence-Based Approach</div>
                                        <div className="text-neutral-600">All our assessments are based on validated psychological research and clinical standards.</div>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <svg className="w-6 h-6 text-primary-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <div className="font-semibold text-neutral-900">AI-Powered Insights</div>
                                        <div className="text-neutral-600">Advanced machine learning algorithms provide objective emotional analysis and personalized recommendations.</div>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <svg className="w-6 h-6 text-primary-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Professional Support Network</div>
                                        <div className="text-neutral-600">Connect with licensed mental health professionals and build a support system that works for you.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-primary-200 to-secondary-200 rounded-2xl p-12 text-center">
                            <div className="text-6xl mb-6">🧠</div>
                            <h3 className="text-2xl font-bold mb-4 text-neutral-900">Our Mission</h3>
                            <p className="text-lg text-neutral-700 leading-relaxed">
                                To make mental wellness accessible, affordable, and effective for everyone through innovative technology and compassionate support.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 bg-gradient-to-br from-primary-500 to-primary-300">
                <div className="container-custom text-center text-white">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Wellness Journey?</h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                        Join thousands of users who are taking control of their mental health with StressAway. Get started for free today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register" className="btn btn-white btn-lg hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                            Create Free Account
                        </Link>
                        <Link href="/login" className="btn btn-outline border-white text-white hover:bg-white/10 btn-lg hover:scale-105 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            <footer id="contact" className="bg-neutral-900 text-white py-12">
                <div className="container-custom">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="">
                                <Logo height={70} variant="white" className="-ml-4" />
                            </div>
                            <p className="text-neutral-400 text-sm">
                                Your trusted partner in mental wellness and stress management.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-neutral-400">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                                <li><Link href="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-neutral-400">
                                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                                {/* <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li> */}
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-neutral-400">
                                <li><Link href="/help-center" className="hover:text-white transition-colors">FAQs</Link></li>
                                <li><Link href="/crisis-resources" className="hover:text-white transition-colors">Crisis Resources</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
                        <p>© 2026 StressAway. All rights reserved. Your mental wellness matters.</p>
                        <div className="flex justify-center space-x-4 mt-2">
                            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        </div>
                        <p className="mt-4">
                            <strong className="text-red-400">Rescue Hotline:</strong> 1122 (Punjab Emergency Service)
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

