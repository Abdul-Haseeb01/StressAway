'use client';

import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />
            <main className="pt-32 pb-20">
                <div className="container-custom max-w-4xl mx-auto">
                    <h1 className="text-5xl font-black text-neutral-900 mb-10">Terms of Service</h1>
                    <div className="space-y-8 text-neutral-600 leading-relaxed">
                        <p>Welcome to StressAway. By accessing our platform, you agree to comply with our usage terms designed to protect the integrity of our AI wellness systems.</p>
                        <section>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Acceptable Use</h2>
                            <p>You agree not to use our Facial Emotion Recognition technology for any deceptive purposes. Our tools are provided strictly for personal wellness monitoring and professional psychological consultation.</p>
                        </section>
                        <section>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-4">SOS System Responsibility</h2>
                            <p>Our SOS alert system is a supplementary tool and should not be considered a replacement for the 1122 Emergency Service. StressAway is not liable for network or service interruptions that may delay SOS notifications.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
