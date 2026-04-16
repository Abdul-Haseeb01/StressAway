'use client';

import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';

const faqs = [
    {
        q: "How does the Facial Analysis work?",
        a: "Our AI analyzes micro-expressions using your camera to detect emotional shifts related to stress. This data is processed locally and is highly secure."
    },
    {
        q: "Is my data shared with anyone?",
        a: "Only with people you explicitly connect with, such as family members or mental health professionals added through your dashboard."
    },
    {
        q: "How do I trigger an SOS?",
        a: "You can trigger SOS manually from your dashboard or profile, or automatically if your stress scores reach high-danger levels during assessments."
    }
];

export default function HelpCenterPage() {
    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />
            <main className="pt-32 pb-20">
                <div className="container-custom mx-auto max-w-4xl">
                    <h1 className="text-5xl font-black text-neutral-900 mb-10 text-center">Help Center</h1>
                    <div className="grid gap-6">
                        {faqs.map((faq, i) => (
                            <div key={i} className="p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer">
                                <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                                    <span className="text-primary-600 mr-3">Q:</span> {faq.q}
                                </h3>
                                <p className="text-neutral-600 pl-8 leading-relaxed">
                                    <span className="font-bold text-neutral-400 mr-2">A:</span> {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
