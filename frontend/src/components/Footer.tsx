'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer id="contact" className="bg-neutral-900 text-white py-12">
            <div className="container-custom">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-navy-gradient rounded-lg flex items-center justify-center shadow-navy">
                                <span className="text-white font-bold">S</span>
                            </div>
                            <span className="text-xl font-bold">StressAway</span>
                        </div>
                        <p className="text-neutral-400 text-sm">
                            Your trusted partner in mental wellness and stress management.
                        </p>
                    </div>
                    {/* <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                            <li><Link href="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                        </ul>
                    </div> */}
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
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
                    <p className="mt-1 text-xs opacity-50">Support: stressawaysupport@gmail.com</p>
                </div>
            </div>
        </footer>
    );
}
