'use client';

import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />

            <main className="pt-32 pb-20">
                <div className="container-custom max-w-4xl mx-auto">
                    <div className="mb-12 text-center">
                        <div className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
                            Updated: April 14, 2026
                        </div>
                        <h1 className="text-5xl font-black text-neutral-900 mb-6">Privacy Policy</h1>
                        <p className="text-lg text-neutral-600">
                            Your trust is our priority. We are committed to protecting your personal information and your right to privacy.
                        </p>
                    </div>

                    <div className="prose prose-neutral max-w-none space-y-10 text-neutral-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm">01</span>
                                Information We Collect
                            </h2>
                            <p>
                                We collect personal information that you provide to us, such as your name, email address, and demographic information during registration.
                                For the Facial Emotion Recognition feature, our AI models analyze your facial expressions in real-time.
                                <strong className="text-primary-600 block mt-2">No video or images are stored permanently on our servers unless explicitly shared for professional consultation.</strong>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center mr-3 text-sm">02</span>
                                How We Use Your Data
                            </h2>
                            <p>
                                Your data is used to provide you with personalized stress assessments, tracking trends, and connecting you with wellness resources.
                                We use anonymized, aggregated data to improve our stress-detection algorithms and contribute to mental health research.
                            </p>
                        </section>

                        <section className="bg-neutral-50 p-8 rounded-3xl border border-neutral-100">
                            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Our Commitment</h2>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">✓</div>
                                    <span>We never sell your personal data to third parties.</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">✓</div>
                                    <span>All data transmission is encrypted using industry-standard SSL/TLS.</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">✓</div>
                                    <span>You have the right to request full deletion of your account and data at any time.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mr-3 text-sm">03</span>
                                Contact Us Regarding Privacy
                            </h2>
                            <p>
                                If you have questions or comments about this policy, you may email us at
                                <a href="" className="text-primary-600 font-bold ml-1">stressawaysupport@gmail.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
