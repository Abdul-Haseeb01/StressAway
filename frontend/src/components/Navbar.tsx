import Link from 'next/link';
import Logo from './Logo';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
            <div className="container-custom">
                <div className="flex justify-between items-center h-20">
                    <Link href="/" className="flex items-center flex-shrink-0">
                        <Logo height={75} className="-ml-3" />
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/#features" className="text-neutral-600 hover:text-primary-800 transition-colors font-medium">Features</Link>
                        <Link href="/#how-it-works" className="text-neutral-600 hover:text-primary-800 transition-colors font-medium">How It Works</Link>
                        <Link href="/#about" className="text-neutral-600 hover:text-primary-800 transition-colors font-medium">About</Link>
                        <Link href="/crisis-resources" className="text-red-600 hover:text-red-700 transition-colors font-bold group flex items-center">
                            SOS Resources
                            <span className="ml-1 animate-pulse">🚨</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Link href="/login" className="hidden sm:block text-sm font-bold text-neutral-900 hover:text-primary-600 transition-colors">
                            Sign In
                        </Link>
                        <Link href="/register" className="bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 whitespace-nowrap">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
