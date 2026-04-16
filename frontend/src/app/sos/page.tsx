'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAlert } from '@/context/AlertContext';
import {
    triggerSOS,
    getSOSAlerts,
    getSosContacts,
    approveSosContact,
    rejectSosContact,
    removeSosContact
} from '@/utils/api';

export default function SOS() {
    const router = useRouter();
    const { showAlert, showConfirm } = useAlert();
    const [sending, setSending] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [showSosConfirm, setShowSosConfirm] = useState(false);
    const [message, setMessage] = useState('');

    // Data
    const [records, setRecords] = useState<any[]>([]);
    const [sosContacts, setSosContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'send' | 'contacts' | 'history'>('send');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userDataStr = localStorage.getItem('user');
        if (!token || !userDataStr) { router.push('/login'); return; }
        const u = JSON.parse(userDataStr);
        if (u.role === 'admin' || u.role === 'super_admin') { router.push('/admin'); return; }
        if (u.role === 'psychologist') { router.push('/psychologist'); return; }
        setIsAuthorized(true);
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [alertsRes, contactsRes] = await Promise.all([
                getSOSAlerts(),
                getSosContacts()
            ]);
            setRecords(Array.isArray(alertsRes) ? alertsRes : []);
            setSosContacts(Array.isArray(contactsRes) ? contactsRes : []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const handleSend = async () => {
        setShowSosConfirm(false);
        setSending(true);
        try {
            const res = await triggerSOS(message || undefined);
            showAlert(res?.message || 'Emergency SOS Sent Successfully!', 'success');
            setMessage('');
            loadData();
        } catch {
            showAlert('Critical Error: Could not send SOS alerts. Please call emergency services.', 'error');
        } finally {
            setSending(false);
        }
    };

    const emergencyContacts = [
        { name: 'Rescue 1122', number: '1122', available: '24/7' },
        { name: 'Pakistan Police', number: '15', available: '24/7' },
    ];

    if (!isAuthorized) return null;

    const statusColor: Record<string, string> = {
        active:       'bg-red-100 text-red-700 border-red-200',
        acknowledged: 'bg-amber-100 text-amber-700 border-amber-200',
        resolved:     'bg-green-100 text-green-700 border-green-200',
    };

    const handleApprove = async (id: string) => {
        try { await approveSosContact(id); showAlert('SOS Request approved!', 'success'); loadData(); }
        catch { showAlert('Failed to approve request', 'error'); }
    };

    const handleReject = async (id: string) => {
        try { await rejectSosContact(id); showAlert('SOS Request declined', 'info'); loadData(); }
        catch { showAlert('Failed to decline request', 'error'); }
    };

    const handleRemove = async (id: string, isIncoming: boolean = true) => {
        const msg = isIncoming 
            ? 'Stop receiving SOS alerts from this person? You will no longer be notified of their emergencies.' 
            : 'Remove this person from your emergency contacts? They will no longer be notified when you trigger an SOS.';
        
        if (!await showConfirm(msg)) return;
        
        try { 
            await removeSosContact(id); 
            showAlert('SOS Contact removed successfully', 'success'); 
            loadData(); 
        } catch { 
            showAlert('Failed to remove SOS contact', 'error'); 
        }
    };

    // Derived SOS data
    // Incoming pending requests (People asking ME to be their emergency contact)
    const incomingPending = sosContacts.filter(c => c.status === 'pending' && c.is_incoming);
    
    // My approved contacts (People I send SOS to)
    const myApproved = sosContacts.filter(c => c.status === 'approved' && !c.is_incoming);
    
    // People who send ME SOS alerts
    const relyingOnMe = sosContacts.filter(c => c.status === 'approved' && c.is_incoming);

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />

            <main className="flex-1 pt-24 pb-12">
                <div className="container-custom max-w-2xl">

                    {/* Page header */}
                    <div className="mb-8 text-center">
                        <div className="text-6xl mb-4 animate-pulse">🚨</div>
                        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Emergency SOS</h1>
                        <p className="text-neutral-500">Get immediate help when you need it most</p>
                    </div>

                    {/* Tab bar */}
                    <div className="bg-white p-1 rounded-xl border border-neutral-200 inline-flex shadow-sm mb-6 w-full">
                        {([
                            { key: 'send', label: '🚨 Send SOS' },
                            { key: 'contacts', label: `👥 Contacts${incomingPending.length ? ` (${incomingPending.length})` : ''}` },
                            { key: 'history', label: '📋 History' },
                        ] as const).map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key
                                    ? 'bg-red-600 text-white shadow'
                                    : 'text-neutral-500 hover:text-neutral-900'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── SEND TAB ── */}
                    {tab === 'send' && (
                        <>
                            {/* Main SOS card */}
                            <div className="card mb-6 text-center bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                                <p className="text-neutral-600 text-sm mb-4">
                                    Notifies all your SOS contacts (family &amp; psychologist).
                                    <br />
                                    <a href="/family" className="text-primary-600 hover:underline text-xs">Manage SOS contacts →</a>
                                </p>

                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    rows={2}
                                    placeholder="Optional: describe what's happening…"
                                    className="w-full px-4 py-3 border border-red-100 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-5"
                                />

                                <button
                                    onClick={() => setShowSosConfirm(true)}
                                    disabled={sending}
                                    className="w-full py-5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-2xl rounded-2xl shadow-lg transition-all disabled:opacity-60"
                                >
                                    {sending ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending Alert…
                                        </span>
                                    ) : '🚨 SEND SOS'}
                                </button>
                            </div>

                            {/* Hotlines */}
                            <div className="card mb-6">
                                <h2 className="text-lg font-bold mb-4 text-neutral-900">📞 Crisis Hotlines</h2>
                                <div className="space-y-3">
                                    {emergencyContacts.map((c, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                            <div>
                                                <p className="font-semibold text-sm text-neutral-900">{c.name}</p>
                                                <p className="text-xs text-neutral-400">{c.available}</p>
                                            </div>
                                            <a
                                                href={`tel:${c.number.replace(/[^0-9]/g, '')}`}
                                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                📞 {c.number}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Safety */}
                            <div className="card">
                                <h2 className="text-lg font-bold mb-4 text-neutral-900">🛡️ Safety Resources</h2>
                                <div className="space-y-3 text-sm text-neutral-600">
                                    {[
                                        { title: 'You are not alone', desc: 'Help is available and recovery is possible.' },
                                        { title: 'Talk to someone you trust', desc: 'Reach out to a family member or mental health professional.' },
                                        { title: 'Create a safety plan', desc: 'Identify coping strategies and people who can help.' },
                                    ].map((r, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                                            <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <h4 className="font-semibold text-neutral-900 mb-0.5">{r.title}</h4>
                                                <p>{r.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── CONTACTS TAB ── */}
                    {tab === 'contacts' && (
                        <div className="space-y-6">
                            
                            {/* Incoming SOS Requests (Action required by ME) */}
                            {incomingPending.length > 0 && (
                                <div className="card border-orange-200 bg-orange-50/30">
                                    <h2 className="text-xl font-bold mb-4 text-orange-900 border-b border-orange-200 pb-2">
                                        🔔 SOS Requests Awaiting Your Approval 
                                    </h2>
                                    <div className="space-y-3">
                                        {incomingPending.map(c => {
                                            const person = c.user;
                                            const name = person.profiles?.full_name || person.full_name || person.email || 'Someone';
                                            const avatar = person.profiles?.avatar_url || person.avatar_url;
                                            return (
                                                <div key={c.id} className="flex items-center gap-4 p-4 bg-white border border-orange-100 rounded-xl shadow-sm">
                                                    <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-orange-100 flex items-center justify-center font-bold text-orange-700 text-lg">
                                                        {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-neutral-800">{name}</p>
                                                        <p className="text-xs text-neutral-500">Wants you to be their SOS contact</p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button onClick={() => handleApprove(c.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">Accept</button>
                                                        <button onClick={() => handleReject(c.id)} className="px-4 py-2 bg-neutral-100 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors">Decline</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* My Emergency Contacts (Who receives my SOS) */}
                            <div className="card">
                                <h2 className="text-xl font-bold mb-4 text-neutral-900 border-b border-neutral-100 pb-2">
                                    🚨 My Emergency Contacts
                                </h2>
                                <p className="text-sm text-neutral-500 mb-4">
                                    These people will be notified immediately when you trigger an SOS.
                                </p>
                                {myApproved.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                        <div className="text-4xl mb-2">👥</div>
                                        <p className="font-medium text-neutral-600">You haven't setup any SOS contacts</p>
                                        <p className="text-sm mt-1">Go to Family or Psychologists page to add them</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myApproved.map(c => {
                                            const person = c.sos_contact;
                                            const name = person.profiles?.full_name || person.full_name || person.email || 'Someone';
                                            const avatar = person.profiles?.avatar_url || person.avatar_url;
                                            return (
                                                <div key={c.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                                                    <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-red-100 flex items-center justify-center font-bold text-red-700 text-lg">
                                                        {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-neutral-800">{name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                                            Active
                                                        </span>
                                                        <button 
                                                            onClick={() => handleRemove(c.id, false)}
                                                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remove SOS Contact"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* People Relying on me (Who sends me SOS) */}
                            {relyingOnMe.length > 0 && (
                                <div className="card">
                                    <h2 className="text-xl font-bold mb-4 text-neutral-900 border-b border-neutral-100 pb-2">
                                        🛡️ People Relying on You
                                    </h2>
                                    <p className="text-sm text-neutral-500 mb-4">
                                        You are an approved SOS contact for these people.
                                    </p>
                                    <div className="space-y-3">
                                        {relyingOnMe.map(c => {
                                            const person = c.user;
                                            const name = person.profiles?.full_name || person.full_name || person.email || 'Someone';
                                            const avatar = person.profiles?.avatar_url || person.avatar_url;
                                            return (
                                                <div key={c.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                                                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
                                                        {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-neutral-800">{name}</p>
                                                    </div>
                                                    <button onClick={() => handleRemove(c.id)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-lg transition-colors">
                                                        Stop receiving alerts
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* ── HISTORY TAB ── */}
                    {tab === 'history' && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-5 text-neutral-900">SOS Alert History</h2>
                            {loading ? (
                                <div className="text-center py-10 text-neutral-400">Loading…</div>
                            ) : records.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                    <div className="text-5xl mb-3">📋</div>
                                    <p className="font-medium text-neutral-600">No SOS alerts sent yet</p>
                                    <p className="text-sm mt-1">Your alert history will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                    {records.map((r: any) => {
                                        const recipient = r.recipient || {};
                                        const name = recipient.profiles?.full_name || recipient.full_name || recipient.email || 'Unknown Contact';
                                        
                                        return (
                                            <div key={r.id} className="flex items-start gap-4 p-4 bg-white border border-neutral-100 rounded-xl hover:border-red-100 transition-all shadow-sm">
                                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-lg shrink-0">
                                                    🚨
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-bold text-neutral-800">
                                                            To: {name}
                                                        </p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-tight ${r.is_read ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                            {r.is_read ? 'Read' : 'Delivered'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 line-clamp-2 italic mb-2">
                                                        "{r.message || 'Emergency assistance requested'}"
                                                    </p>
                                                    <p className="text-[10px] text-neutral-400 font-medium">
                                                        {new Date(r.created_at).toLocaleString()}
                                                        {r.read_at && ` • Read at ${new Date(r.read_at).toLocaleTimeString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* Confirmation popup */}
            {showSosConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
                        <div className="bg-red-600 px-6 py-4">
                            <h3 className="text-white font-bold text-lg">⚠️ Confirm SOS Alert</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-neutral-600 text-sm mb-6">
                                This will send an emergency alert to all your SOS contacts. Are you sure you need help right now?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSosConfirm(false)}
                                    className="flex-1 py-2 border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSend}
                                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold"
                                >
                                    Yes, Send SOS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
