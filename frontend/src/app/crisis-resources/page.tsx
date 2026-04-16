'use client';

import AdaptiveNavbar from '@/components/AdaptiveNavbar';
import Footer from '@/components/Footer';

const resources = [
    {
        name: "Punjab Emergency Service (Rescue 1122)",
        contact: "1122",
        desc: "24/7 emergency medical, rescue, and ambulance services across Punjab.",
        type: "Emergency"
    },
    {
        name: "Pakistan Mental Health Helpline",
        contact: "042-111-633-311",
        desc: "Confidential mental health support and counseling provided by trained professionals.",
        type: "Helpline"
    },
    {
        name: "UMANG Pakistan",
        contact: "0317-4288665",
        desc: "Dedicated suicide prevention and mental health support services available 24/7.",
        type: "Suicide Prevention"
    },
    {
        name: "Zindagi",
        contact: "0312-5358222",
        desc: "Organization forSupport of emotional distress, anxiety, and crisis intervention.",
        type: "Counseling"
    }
];

export default function CrisisResourcesPage() {
    return (
        <div className="min-h-screen bg-white">
            <AdaptiveNavbar />

            <main className="pt-32 pb-20">
                <div className="container-custom mx-auto">
                    <div className="mb-12 text-center max-w-3xl mx-auto">
                        <div className="inline-block px-4 py-2 bg-red-50 text-red-600 rounded-full text-sm font-semibold mb-4 animate-pulse">
                            🚨 Available 24/7 Support
                        </div>
                        <h1 className="text-5xl font-black text-neutral-900 mb-6">Crisis Resources</h1>
                        <p className="text-xl text-neutral-600">
                            If you or someone you know is in immediate danger or experiencing a mental health crisis, please reach out to the following professionals immediately.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        {resources.map((res, i) => (
                            <div key={i} className="bg-white border-2 border-neutral-100 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${res.type === 'Emergency' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {res.type}
                                </span>
                                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{res.name}</h3>
                                <p className="text-neutral-500 mb-6 leading-relaxed">
                                    {res.desc}
                                </p>
                                <a
                                    href={`tel:${res.contact.replace(/-/g, '')}`}
                                    className="inline-flex items-center justify-center w-full bg-neutral-900 text-white py-4 rounded-2xl font-black text-xl hover:bg-red-600 transition-colors"
                                >
                                    📞 {res.contact}
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* <div className="bg-navy-gradient rounded-[3rem] p-12 text-white text-center shadow-2xl">
                        <h2 className="text-4xl font-black mb-6">Using StressAway SOS</h2>
                        <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Our platform's internal SOS system automatically notifies your designated emergency contacts and linked psychologists. Always ensure your 
                            <strong className="text-accent-300"> Emergency Contacts</strong> are up to date in your dashboard settings.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <div className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20">
                                <div className="text-3xl mb-2">⚡</div>
                                <div className="font-bold">Instant SMS</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20">
                                <div className="text-3xl mb-2">🏥</div>
                                <div className="font-bold">Clinic Alerts</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-8 py-6 rounded-3xl border border-white/20">
                                <div className="text-3xl mb-2">👨‍👩‍👧</div>
                                <div className="font-bold">Family Notified</div>
                            </div>
                        </div>
                    </div> */}
                </div>
            </main>

            <Footer />
        </div>
    );
}
