'use client';

import { useEffect, useState, useRef } from 'react';
import { getUnreadSosNotifications, markSosNotificationRead } from '@/utils/api';

const POLL_INTERVAL = 10000; // 10 seconds

export default function SosAlertModal() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(false);

    // Keep track of IDs already shown so we don't re-show on every poll
    const seenIds = useRef<Set<string>>(new Set());
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchUnread = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const data = await getUnreadSosNotifications();
            if (!Array.isArray(data)) return;

            // Only add truly new ones we haven't shown yet
            const newAlerts = data.filter((a: any) => !seenIds.current.has(a.id));
            if (newAlerts.length > 0) {
                newAlerts.forEach((a: any) => seenIds.current.add(a.id));
                setAlerts(prev => {
                    const combined = [...prev, ...newAlerts];
                    if (!visible) {
                        setCurrent(0);
                        setVisible(true);
                    }
                    return combined;
                });
            }
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchUnread(); // immediate on mount

        timerRef.current = setInterval(fetchUnread, POLL_INTERVAL);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    if (!visible || alerts.length === 0) return null;

    const alert = alerts[current];
    const sender = alert.sender || {};
    const profile = sender.profiles || {};
    const name = profile.full_name || sender.full_name || sender.email || 'Someone';
    const avatarUrl = profile.avatar_url || sender.avatar_url;
    const sentAt = new Date(alert.created_at).toLocaleString();

    const handleRead = async () => {
        try { await markSosNotificationRead(alert.id); } catch { /* silent */ }

        if (current + 1 < alerts.length) {
            setCurrent(c => c + 1);
        } else {
            setVisible(false);
            setAlerts([]);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">

                {/* Pulsing red top bar */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center gap-3">
                    <span className="text-3xl animate-pulse">🚨</span>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Emergency SOS Alert</h2>
                        <p className="text-red-100 text-xs">Someone needs your immediate help</p>
                    </div>
                    {alerts.length > 1 && (
                        <span className="ml-auto bg-red-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {current + 1}/{alerts.length}
                        </span>
                    )}
                </div>

                <div className="p-6">
                    {/* Sender */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-red-100 flex items-center justify-center font-bold text-red-700 text-2xl shrink-0 border-2 border-red-200">
                            {avatarUrl
                                ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                                : name.charAt(0).toUpperCase()
                            }
                        </div>
                        <div>
                            <p className="font-bold text-neutral-900 text-lg">{name}</p>
                            <p className="text-xs text-neutral-400">{sender.email}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">🕐 {sentAt}</p>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
                        {alert.message ? (
                            <>
                                <p className="text-sm font-semibold text-red-800 mb-1">Their message:</p>
                                <p className="text-sm text-red-700 italic">"{alert.message}"</p>
                            </>
                        ) : (
                            <p className="text-sm text-red-700 text-center">
                                <strong>{name}</strong> has triggered an emergency SOS. Please reach out immediately.
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleRead}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                        {current + 1 < alerts.length ? 'I understand — Next alert →' : 'I understand — Close'}
                    </button>
                    <p className="text-xs text-neutral-400 text-center mt-3">
                        This alert will not reappear once dismissed.
                    </p>
                </div>
            </div>
        </div>
    );
}
