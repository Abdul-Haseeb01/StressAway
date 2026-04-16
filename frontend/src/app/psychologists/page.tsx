'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAlert } from '@/context/AlertContext';
import {
    searchPsychologists,
    getConnections,
    createConnectionRequest,
    deleteConnection,
    approveConnection,
    rejectConnection,
    getMessages,
    sendMessage,
    getUnreadCounts,
    getSosContacts,
    sendSosRequest,
    removeSosContact,
} from '@/utils/api';

export default function PsychologistsPage() {
    const router = useRouter();
    const { showAlert, showConfirm } = useAlert();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    type Tab = 'connected' | 'discover' | 'pending';
    const [tab, setTab] = useState<Tab>('connected');

    // Data
    const [connections, setConnections] = useState<any[]>([]);
    const [psychologists, setPsychologists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [searchText, setSearchText] = useState('');

    // SOS connections
    const [sosContacts, setSosContacts] = useState<any[]>([]);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Chat
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const uStr = localStorage.getItem('user');
        if (!token || !uStr) { router.push('/login'); return; }
        const u = JSON.parse(uStr);
        if (u.role === 'admin' || u.role === 'super_admin') { router.push('/admin'); return; }
        if (u.role === 'psychologist') { router.push('/psychologist'); return; }
        setCurrentUser(u);
        setIsAuthorized(true);
        fetchAll();
    }, [router]);

    const fetchAll = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [conns, psychs, sos] = await Promise.all([
                getConnections(), 
                searchPsychologists(),
                getSosContacts()
            ]);
            setConnections(Array.isArray(conns) ? conns : []);
            setPsychologists(Array.isArray(psychs) ? psychs : []);
            setSosContacts(Array.isArray(sos) ? sos : []);
            try { 
                const counts = await getUnreadCounts();
                const countArr = Object.values(counts || {});
                const nextTotal = countArr.reduce((a: number, b: any) => a + Number(b), 0);
                const prevTotal = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

                if (isSilent && nextTotal > prevTotal) {
                    showAlert('New message from your psychologist!', 'info');
                }
                setUnreadCounts(counts || {});
            } catch { }
        } catch { if (!isSilent) showAlert('Failed to load data', 'error'); }
        finally { if (!isSilent) setLoading(false); }
    };

    useEffect(() => {
        if (!isAuthorized) return;
        const pollInterval = setInterval(() => {
            fetchAll(true);
        }, 5000);
        return () => clearInterval(pollInterval);
    }, [isAuthorized, unreadCounts]);

    // Derived
    const connected   = connections.filter(c => c.status === 'approved');
    const pendingOut  = connections.filter(c => c.status === 'pending' && c.user_id === currentUser?.id);
    const pendingIn   = connections.filter(c => c.status === 'pending' && c.connected_user_id === currentUser?.id);
    const allPending  = pendingOut; // User only sees their sent requests in this tab usually, but let's count all for the dot
    const totalPendingCount = pendingOut.length + pendingIn.length;

    const available = psychologists.filter(p =>
        !connections.some(c => c.connected_user_id === p.id || c.user_id === p.id)
    ).filter(p => 
        !searchText || 
        (p.profiles?.full_name || p.full_name || p.email || '').toLowerCase().includes(searchText.toLowerCase())
    );

    const getOther = (conn: any) =>
        conn.user_id === currentUser?.id ? conn.connected_user : conn.user;

    const getName = (person: any) =>
        person?.profiles?.full_name || person?.full_name || person?.email || 'Unknown';

    const getAvatar = (person: any) =>
        person?.profiles?.avatar_url || person?.avatar_url;

    // Actions
    const handleConnect = async (psychId: string) => {
        try {
            await createConnectionRequest({ connected_user_id: psychId, connection_type: 'psychologist' });
            showAlert('Connection request sent successfully!', 'success');
            fetchAll();
        } catch { 
            showAlert('Could not send connection request. You may already have a pending request.', 'error');
        }
    };

    const handleCancel = async (id: string) => {
        if (!await showConfirm('Cancel this connection request?')) return;
        try { await deleteConnection(id); showAlert('Request cancelled', 'info'); fetchAll(); }
        catch { showAlert('Failed to cancel', 'error'); }
    };

    const handleApprove = async (id: string) => {
        try { await approveConnection(id); showAlert('Connection approved!', 'success'); fetchAll(); }
        catch { showAlert('Failed to approve', 'error'); }
    };

    const handleReject = async (id: string) => {
        if (!await showConfirm('Decline this connection request?')) return;
        try { await rejectConnection(id); showAlert('Request declined', 'info'); fetchAll(); }
        catch { showAlert('Failed to reject', 'error'); }
    };

    const handleDisconnect = async (id: string) => {
        if (!await showConfirm('Are you sure you want to disconnect from this psychologist? This will end your clinical connection.')) return;
        try { 
            await deleteConnection(id); 
            showAlert('Disconnected successfully', 'success');
            if (activeChat?.id === id) setActiveChat(null); 
            fetchAll(); 
        } catch { 
            showAlert('Failed to disconnect. Please try again.', 'error');
        }
    };

    const handleSosAction = async (targetId: string, isAdd: boolean, recordId?: string | null) => {
        setTogglingId(targetId);
        try {
            if (isAdd) {
                await sendSosRequest(targetId);
                showAlert('SOS request sent! They will be notified to accept it.', 'success');
            } else if (recordId) {
                await removeSosContact(recordId);
                showAlert('Removed from SOS contacts.', 'info');
            }
            fetchAll(); // refresh sosContacts
        } catch (e: any) {
            showAlert(e?.response?.data?.message || 'Failed to update SOS contact', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    // Chat
    const openChat = async (conn: any) => {
        setActiveChat(conn);
        setUnreadCounts(p => ({ ...p, [conn.id]: 0 }));
        try { setMessages((await getMessages(conn.id)) || []); }
        catch { showAlert('Failed to load messages', 'error'); }
    };

    const handleSendMsg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChat) return;
        setSendingMsg(true);
        try {
            await sendMessage(activeChat.id, messageInput.trim());
            setMessageInput('');
            setMessages((await getMessages(activeChat.id)) || []);
        } catch { showAlert('Failed to send', 'error'); }
        finally { setSendingMsg(false); }
    };

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />

            <main className="flex-1 pt-24 pb-12">
                <div className="container-custom max-w-4xl">

                    {/* Page header + tab bar */}
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 mb-1">Psychologists</h1>
                            <p className="text-neutral-500">Connect with mental health professionals for support</p>
                        </div>
                        <div className="bg-white p-1 rounded-xl border border-neutral-200 inline-flex shadow-sm shrink-0">
                            {([
                                { key: 'connected', label: (
                                    <span className="flex items-center gap-1.5">
                                        🤝 Connected{connected.length ? ` (${connected.length})` : ''}
                                        {Object.values(unreadCounts).some(c => c > 0) && tab !== 'connected' && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                                        )}
                                    </span>
                                )},
                                { key: 'discover',  label: '🔍 Discover' },
                                { key: 'pending',   label: (
                                    <span className="flex items-center gap-1.5">
                                        🔔 Pending{allPending.length ? ` (${allPending.length})` : ''}
                                        {pendingIn.length > 0 && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        )}
                                    </span>
                                )},
                            ] as const).map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="card text-center py-16 text-neutral-400">Loading…</div>
                    ) : (
                        <>
                            {/* ── CONNECTED TAB ── */}
                            {tab === 'connected' && (
                                <div className="card">
                                    <h2 className="text-xl font-bold mb-6 text-neutral-900">Your Psychologists</h2>
                                    {connected.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                            <div className="text-5xl mb-3">👨‍⚕️</div>
                                            <p className="font-medium text-neutral-600">No connections yet</p>
                                            <p className="text-sm mt-1">Use "Discover" to find a psychologist</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {connected.map(conn => {
                                                const other = getOther(conn);
                                                const name = getName(other);
                                                const avatar = getAvatar(other);
                                                const hasUnread = (unreadCounts[conn.id] || 0) > 0;
                                                const sosRecord = sosContacts.find(s => !s.is_incoming && s.sos_contact_id === other?.id);

                                                return (
                                                    <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl hover:border-primary-200 transition-all shadow-sm group">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            {/* Avatar */}
                                                            <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-lg relative shadow-inner">
                                                                {avatar
                                                                    ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                                    : name.charAt(0).toUpperCase()
                                                                }
                                                            </div>
                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-neutral-900 truncate tracking-tight">{name}</p>
                                                                <p className="text-[10px] font-bold text-neutral-400 mt-0.5 truncate">{other?.email}</p>
                                                            </div>
                                                        </div>

                                                        {/* Actions container */}
                                                        <div className="flex items-center gap-2 justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-50 sm:ml-auto">
                                                            {/* SOS button */}
                                                            {sosRecord ? (
                                                                sosRecord.status === 'pending' ? (
                                                                    <div className="shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1.5 opacity-80">
                                                                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                                                                        Pending
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (await showConfirm(`Remove ${name} from your SOS contacts?`)) {
                                                                                handleSosAction(other.id, false, sosRecord.id);
                                                                            }
                                                                        }}
                                                                        disabled={togglingId === other.id}
                                                                        className="shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all flex items-center gap-1.5"
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                        SOS
                                                                    </button>
                                                                )
                                                            ) : (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (await showConfirm(`Add ${name} as SOS contact?`)) {
                                                                            handleSosAction(other.id, true, null);
                                                                        }
                                                                    }}
                                                                    disabled={togglingId === other.id}
                                                                    className="shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-neutral-50 text-neutral-500 border border-neutral-200 hover:bg-white hover:text-primary-600 hover:border-primary-200 transition-all"
                                                                >
                                                                    + SOS
                                                                </button>
                                                            )}

                                                            {/* Chat */}
                                                            <button
                                                                onClick={() => openChat(conn)}
                                                                className="shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-soft-sm flex items-center gap-1.5 relative"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                                Chat
                                                                {hasUnread && (
                                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {/* Disconnect */}
                                                            <button
                                                                onClick={() => handleDisconnect(conn.id)}
                                                                className="shrink-0 w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                                                                title="Disconnect"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── DISCOVER TAB ── */}
                            {tab === 'discover' && (
                                <div className="card">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <h2 className="text-xl font-bold text-neutral-900">Available Psychologists</h2>
                                        <div className="relative w-full sm:w-64">
                                            <input
                                                type="text"
                                                placeholder="Search by name…"
                                                value={searchText}
                                                onChange={e => setSearchText(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                                            />
                                            <svg className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                    </div>
                                    {available.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                            <div className="text-5xl mb-3">🎉</div>
                                            <p className="font-medium text-neutral-600">You've connected with all available psychologists</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {available.map(psych => {
                                                const name = psych.profiles?.full_name || psych.full_name || psych.email || 'Dr. Anonymous';
                                                const avatar = psych.profiles?.avatar_url || psych.avatar_url;
                                                return (
                                                    <div key={psych.id} className="flex flex-col xs:flex-row xs:items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl hover:border-indigo-200 transition-all shadow-sm">
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-indigo-50 flex items-center justify-center font-black text-indigo-700 text-lg shadow-inner">
                                                                {avatar
                                                                    ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                                    : '👨‍⚕️'
                                                                }
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-neutral-900 tracking-tight truncate">{name}</p>
                                                                <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Psychologist</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleConnect(psych.id)}
                                                            className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-soft-sm"
                                                        >
                                                            Connect
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── PENDING TAB ── */}
                            {tab === 'pending' && (
                                <div className="card space-y-8">
                                    {/* Outgoing */}
                                    <div>
                                        <h2 className="text-xl font-bold mb-4 text-neutral-900">Sent Requests</h2>
                                        {pendingOut.length === 0 ? (
                                            <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                                <div className="text-4xl mb-2">📤</div>
                                                <p className="font-medium text-neutral-600">No sent requests</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {pendingOut.map(conn => {
                                                    const other = getOther(conn);
                                                    const name = getName(other);
                                                    const avatar = getAvatar(other);
                                                    return (
                                                        <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
                                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-amber-100 flex items-center justify-center font-black text-amber-700 text-lg shadow-inner">
                                                                    {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-neutral-900 truncate tracking-tight">{name}</p>
                                                                    <p className="text-[10px] font-bold text-neutral-400 mt-0.5 truncate">{other?.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-50 sm:ml-auto">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">Pending</span>
                                                                <button onClick={() => handleCancel(conn.id)} className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all font-bold" title="Cancel Request">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Chat slide-out */}
            {activeChat && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.1)] z-50 flex flex-col">
                    <div className="p-4 border-b border-neutral-100 bg-primary-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                                {getName(getOther(activeChat)).charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold">{getName(getOther(activeChat))}</h3>
                                <p className="text-xs text-primary-200">Secure Messaging</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/10 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 flex flex-col gap-3">
                        {messages.length === 0 ? (
                            <div className="m-auto text-neutral-400 text-sm text-center bg-white p-4 rounded-xl border border-neutral-100">Start of your secure conversation</div>
                        ) : messages.map(msg => {
                            const isMe = msg.sender_id === currentUser?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'}`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-neutral-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <form onSubmit={handleSendMsg} className="p-4 border-t border-neutral-200 bg-white flex gap-2 shrink-0">
                        <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type a message…" className="input flex-1 bg-neutral-100 border-none focus:ring-primary-500" />
                        <button type="submit" disabled={sendingMsg || !messageInput.trim()} className="bg-primary-600 text-white w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}

            <Footer />
        </div>
    );
}
