// Root Layout
'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { AlertProvider } from '@/context/AlertContext';
import SosAlertModal from '@/components/SosAlertModal';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <head>
                <title>StressAway - Mental Wellness Platform</title>
                <meta name="description" content="Monitor and manage stress through AI-powered assessments and wellness activities" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={inter.className}>
                <Provider store={store}>
                    <AlertProvider>
                        <SosAlertModal />
                        {children}
                    </AlertProvider>
                </Provider>
            </body>
        </html>
    );
}
