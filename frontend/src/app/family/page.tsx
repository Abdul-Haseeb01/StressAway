'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAlert } from '@/context/AlertContext';
import {
    getFamilyConnections,
    createFamilyRequest,
    deleteFamilyConnection,
    approveFamilyConnection,
    rejectFamilyConnection,
    searchUsers,
    getSosContacts,
    sendSosRequest,
    removeSosContact,
    toggleFamilySosContact,
    toggleFamilyLogSharing,
    getFamilySharedLogs,
    getReceivedSosAlerts,
} from '@/utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FAMILY_ROLES = [
    { value: 'father', label: 'Father' },
    { value: 'mother', label: 'Mother' },
    { value: 'child', label: 'Child' },
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'friend', label: 'Friend' },
    { value: 'relative', label: 'Relative' },
];

const RECIPROCAL_ROLES: Record<string, string> = {
    'father': 'child',
    'mother': 'child',
    'brother': 'brother',
    'sister': 'sister',
    'spouse': 'spouse',
    'friend': 'friend',
    'relative': 'relative',
    'other': 'other'
};

export default function FamilyPage() {
    const router = useRouter();
    const { showAlert, showConfirm } = useAlert();

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [tab, setTab] = useState<'members' | 'invite' | 'pending'>('members');

    // Family connections
    const [connections, setConnections] = useState<any[]>([]);
    const [loadingConns, setLoadingConns] = useState(true);

    // SOS connections
    const [sosContacts, setSosContacts] = useState<any[]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Search
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Invite form
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedRole, setSelectedRole] = useState('friend');
    const [sending, setSending] = useState(false);

    // Logs view
    const [viewingLogs, setViewingLogs] = useState<any | null>(null);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [sharedLogsData, setSharedLogsData] = useState<any | null>(null);

    // Auth
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!token || !userStr) { router.push('/login'); return; }
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.role === 'super_admin') { router.push('/admin'); return; }
        if (u.role === 'psychologist') { router.push('/psychologist'); return; }
        setIsAuthorized(true);
        loadConnections();
    }, [router]);

    const loadConnections = async (isSilent = false) => {
        if (!isSilent) setLoadingConns(true);
        try {
            const [fam, sos, alerts] = await Promise.all([
                getFamilyConnections(),
                getSosContacts(),
                getReceivedSosAlerts()
            ]);
            setConnections(Array.isArray(fam) ? fam : []);
            setSosContacts(Array.isArray(sos) ? sos : []);
            setSosAlerts(Array.isArray(alerts) ? alerts : []);
        } catch {
            if (!isSilent) showAlert('Failed to load connections', 'error');
        } finally {
            if (!isSilent) setLoadingConns(false);
        }
    };

    useEffect(() => {
        if (!isAuthorized) return;

        // Polling interval for real-time updates (every 5 seconds)
        const interval = setInterval(() => {
            loadConnections(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAuthorized]);

    // Live search with debounce
    const handleSearch = useCallback((val: string) => {
        setQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!val.trim()) { setSearchResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const results = await searchUsers(val.trim());
                setSearchResults(Array.isArray(results) ? results : []);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);
    }, []);

    const handleSelectUser = (u: any) => {
        setSelectedUser(u);
        setQuery(u.full_name || u.email);
        setSearchResults([]);
    };

    const handleSendRequest = async () => {
        if (!selectedUser) { showAlert('Please search and select a user first', 'error'); return; }

        if (!await showConfirm(`Send family connection request to ${selectedUser.full_name || selectedUser.email}?`)) return;

        setSending(true);
        try {
            await createFamilyRequest(selectedUser.id, selectedRole);
            showAlert(`Family connection request sent to ${selectedUser.full_name || selectedUser.email}!`, 'success');
            setSelectedUser(null);
            setQuery('');
            setSelectedRole('parent');
            loadConnections();
        } catch (err: any) {
            showAlert(err?.response?.data?.message || 'Failed to send request', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleApprove = async (id: string, name: string) => {
        if (!await showConfirm(`Accept family connection request from ${name}?`)) return;
        try {
            await approveFamilyConnection(id);
            showAlert('Connection approved!', 'success');
            loadConnections();
        } catch {
            showAlert('Failed to approve connection', 'error');
        }
    };

    const handleReject = async (id: string) => {
        if (!await showConfirm('Are you sure you want to decline this family request?')) return;
        try {
            await rejectFamilyConnection(id);
            showAlert('Connection rejected.', 'info');
            loadConnections();
        } catch {
            showAlert('Failed to reject connection', 'error');
        }
    };

    const handleRemove = async (id: string) => {
        if (!await showConfirm('Are you sure you want to remove this family member?')) return;
        try {
            await deleteFamilyConnection(id);
            showAlert('Family member removed successfully', 'success');
            loadConnections();
        } catch {
            showAlert('Failed to remove connection', 'error');
        }
    };

    const roleLabel = (val: string) => FAMILY_ROLES.find(r => r.value === val)?.label || val;

    const getDisplayRole = (conn: any) => {
        const baseRole = conn.family_role || 'other';
        if (!conn.is_incoming) {
            // I am the sender, I selected this role for them
            return roleLabel(baseRole);
        } else {
            // I am the receiver, I should see the reciprocal role
            const reciprocal = RECIPROCAL_ROLES[baseRole] || baseRole;
            return roleLabel(reciprocal);
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
            loadConnections();
        } catch (e: any) {
            showAlert(e?.response?.data?.message || 'Failed to update SOS contact', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleToggleSharing = async (connId: string, currentVal: boolean) => {
        try {
            await toggleFamilyLogSharing(connId, !currentVal);
            showAlert(!currentVal ? 'Stress logs shared!' : 'Sharing stopped.', 'info');
            loadConnections();
        } catch {
            showAlert('Failed to update sharing preference', 'error');
        }
    };

    const handleViewLogs = async (conn: any) => {
        setViewingLogs(conn);
        setLoadingLogs(true);
        try {
            const data = await getFamilySharedLogs(conn.id);
            setSharedLogsData(data);
        } catch (err: any) {
            showAlert(err?.response?.data?.message || 'Failed to load shared logs', 'error');
            setViewingLogs(null);
        } finally {
            setLoadingLogs(false);
        }
    };

    const approvedMembers = connections.filter(c => c.status === 'approved');
    const pendingIncoming = connections.filter(c => c.status === 'pending' && c.is_incoming);
    const pendingOutgoing = connections.filter(c => c.status === 'pending' && !c.is_incoming);

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Header />

            <main className="flex-1 pt-24 pb-12">
                <div className="container-custom max-w-4xl">

                    {/* Header */}
                    <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900 mb-1">Family Connections</h1>
                            <p className="text-neutral-500">Manage your support network of family members</p>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-neutral-200 inline-flex shadow-sm">
                            {([
                                { key: 'members', label: '👨‍👩‍👧 Members' },
                                { key: 'invite', label: '➕ Add Family' },
                                {
                                    key: 'pending', label: (
                                        <span className="flex items-center gap-1.5">
                                            🔔 Pending{pendingIncoming.length ? ` (${pendingIncoming.length})` : ''}
                                            {pendingIncoming.length > 0 && (
                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            )}
                                        </span>
                                    )
                                },
                            ] as const).map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === t.key
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── MEMBERS TAB ── */}
                    {tab === 'members' && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-6 text-neutral-900">Your Family Members</h2>
                            {loadingConns ? (
                                <div className="text-center py-12 text-neutral-400">Loading…</div>
                            ) : approvedMembers.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400">
                                    <div className="text-5xl mb-3 opacity-50">👨‍👩‍👧‍👦</div>
                                    <p className="font-bold text-neutral-600">No family members yet</p>
                                    <p className="text-sm mt-1">Use the "Add Family" tab to invite them</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {approvedMembers.map(conn => {
                                        const isRequester = !conn.is_incoming;
                                        const other = isRequester ? (conn.connected_user || {}) : (conn.requester || {});
                                        const profile = other.profiles || {};
                                        const name = profile.full_name || other.full_name || other.email || 'Unknown';
                                        const avatar = profile.avatar_url || other.avatar_url;
                                        const displayRole = getDisplayRole(conn);
                                        const sosRecord = sosContacts.find(s => !s.is_incoming && s.sos_contact_id === other.id);

                                        return (
                                            <div key={conn.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl hover:border-primary-200 transition-colors shadow-sm">
                                                <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg">
                                                    {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="font-bold text-neutral-900 truncate max-w-[140px] sm:max-w-none">{name}</p>
                                                        <span className="bg-primary-50 text-primary-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight whitespace-nowrap">
                                                            {displayRole}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-400 truncate mt-0.5">{other.email}</p>
                                                </div>
                                                <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto pt-1 sm:pt-0">
                                                    <button
                                                        onClick={() => handleToggleSharing(conn.id, conn.is_incoming ? conn.share_logs_to_user : conn.share_logs_to_connected)}
                                                        className={`p-2 rounded-xl transition-all ${(conn.is_incoming ? conn.share_logs_to_user : conn.share_logs_to_connected) ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-neutral-50 text-neutral-400 border border-neutral-100'}`}
                                                        title="Log Sharing"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                    {(conn.is_incoming ? conn.share_logs_to_connected : conn.share_logs_to_user) && (
                                                        <button
                                                            onClick={() => handleViewLogs(conn)}
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-100 transition-all"
                                                            title="Health Insights"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                        </button>
                                                    )}
                                                    {/* SOS Button Logic Ported from Psychologists Page */}
                                                    <div className="flex items-center gap-2">
                                                        {sosRecord ? (
                                                            sosRecord.status === 'pending' ? (
                                                                <div className="shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1.5 opacity-80" title="SOS status Pending">
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
                                                                    title="Remove SOS Contact"
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
                                                                title="Add SOS Contact"
                                                            >
                                                                + SOS
                                                            </button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemove(conn.id)}
                                                        className="p-2 text-neutral-300 hover:text-red-500 transition-colors rounded-xl hover:bg-neutral-100"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── MODAL: VIEW HEALTH REPORT ── */}
                    {viewingLogs && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {(sharedLogsData?.user?.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-neutral-900">{sharedLogsData?.user?.profiles?.full_name || 'Health Report'}</h3>
                                            <p className="text-xs text-neutral-500">Shared Stress Analysis Insights</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setViewingLogs(null); setSharedLogsData(null); }} className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-neutral-50 rounded-full transition-all">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-50/30">
                                    {loadingLogs ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-neutral-500 font-medium">Fetching stress insights...</p>
                                        </div>
                                    ) : sharedLogsData ? (
                                        <>
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Average Stress</p>
                                                    <div className="flex items-end gap-2">
                                                        <h4 className="text-4xl font-black text-primary-600">
                                                            {(() => {
                                                                const scores = [...(sharedLogsData.questionnaire_logs || []), ...(sharedLogsData.facial_logs || [])].map(l => parseFloat(l.stress_score));
                                                                if (!scores.length) return 'N/A';
                                                                return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
                                                            })()}%
                                                        </h4>
                                                        {sharedLogsData.questionnaire_logs?.length > 0 && <span className="text-xs text-neutral-400 mb-1.5 pb-0.5">from {sharedLogsData.questionnaire_logs.length + sharedLogsData.facial_logs.length} assessments</span>}
                                                    </div>
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Latest Mood</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-3xl">
                                                            {sharedLogsData.facial_logs[0]?.detected_emotion === 'happy' ? '😊' :
                                                                sharedLogsData.facial_logs[0]?.detected_emotion === 'sad' ? '😔' :
                                                                    sharedLogsData.facial_logs[0]?.detected_emotion === 'angry' ? '😠' : '😐'}
                                                        </span>
                                                        <div>
                                                            <p className="font-bold text-neutral-800 capitalize">{sharedLogsData.facial_logs[0]?.detected_emotion || 'Balanced'}</p>
                                                            <p className="text-xs text-neutral-400">Recorded {new Date(sharedLogsData.facial_logs[0]?.created_at || Date.now()).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trend Chart */}
                                            <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                                                <h4 className="font-bold text-neutral-800 mb-6 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M3 4v16M3 4l18 16" /></svg>
                                                    Weekly Stress Trend
                                                </h4>
                                                <div className="h-[250px] w-full">
                                                    <Line
                                                        data={{
                                                            labels: [...(sharedLogsData.questionnaire_logs || []), ...(sharedLogsData.facial_logs || [])]
                                                                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                                .slice(-10)
                                                                .map(l => new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })),
                                                            datasets: [{
                                                                label: 'Stress Score (%)',
                                                                data: [...(sharedLogsData.questionnaire_logs || []), ...(sharedLogsData.facial_logs || [])]
                                                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                                    .slice(-10)
                                                                    .map(l => parseFloat(l.stress_score)),
                                                                borderColor: '#4f46e5',
                                                                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                                                tension: 0.4,
                                                                fill: true,
                                                                pointRadius: 4,
                                                                pointBackgroundColor: '#fff',
                                                                pointBorderWidth: 2,
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: { legend: { display: false } },
                                                            scales: {
                                                                y: {
                                                                    min: 0,
                                                                    max: 100,
                                                                    grid: { color: '#f3f4f6' },
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Stress Levels',
                                                                        color: '#666',
                                                                        font: {
                                                                            size: 12,
                                                                            weight: 'bold' as const
                                                                        }
                                                                    }
                                                                },
                                                                x: { grid: { display: false } }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Recent Logs List */}
                                            <div>
                                                <h4 className="font-bold text-neutral-800 mb-4">Latest Assessments</h4>
                                                <div className="space-y-2">
                                                    {[...(sharedLogsData.questionnaire_logs || []), ...(sharedLogsData.facial_logs || [])]
                                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                        .slice(0, 5)
                                                        .map((log, i) => (
                                                            <div key={i} className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full ${parseFloat(log.stress_score) > 60 ? 'bg-red-500' : 'bg-green-500'}`} />
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-neutral-800">{log.detected_emotion ? 'Facial Analysis' : 'Questionnaire'}</p>
                                                                        <p className="text-[10px] text-neutral-400 capitalize">{new Date(log.created_at).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-sm font-black ${parseFloat(log.stress_score) > 60 ? 'text-red-500' : 'text-neutral-700'}`}>{parseFloat(log.stress_score).toFixed(0)}%</span>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20 text-neutral-400">No data found</div>
                                    )}
                                </div>
                                <div className="p-4 bg-white border-t border-neutral-100 flex justify-end">
                                    <button onClick={() => { setViewingLogs(null); setSharedLogsData(null); }} className="btn bg-neutral-100 text-neutral-700 hover:bg-neutral-200 px-6 py-2 rounded-xl text-sm font-bold">Close Report</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── INVITE TAB ── */}
                    {tab === 'invite' && (
                        <div className="card max-w-xl mx-auto">
                            <h2 className="text-xl font-bold mb-2 text-neutral-900">Add a Family Member</h2>
                            <p className="text-neutral-500 text-sm mb-6">Search by name or email, assign their role, and send a request.</p>

                            {/* Search input */}
                            <div className="mb-4 relative">
                                <label className="text-sm font-semibold text-neutral-700 mb-2 block">Search User</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Type name or email…"
                                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                                    />
                                    {searching && (
                                        <div className="absolute right-3 top-3">
                                            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Search results dropdown */}
                                {searchResults.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                                        {searchResults.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => handleSelectUser(u)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm shrink-0">
                                                    {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-neutral-800">{u.full_name || '—'}</p>
                                                    <p className="text-xs text-neutral-400">{u.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {query && !searching && searchResults.length === 0 && (
                                    <p className="text-xs text-neutral-400 mt-2">No users found matching "{query}"</p>
                                )}
                            </div>

                            {/* Selected user chip */}
                            {selectedUser && (
                                <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-100 rounded-xl mb-4">
                                    <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center font-bold text-primary-800 text-sm">
                                        {(selectedUser.full_name || selectedUser.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-primary-900">{selectedUser.full_name}</p>
                                        <p className="text-xs text-primary-600">{selectedUser.email}</p>
                                    </div>
                                    <button onClick={() => { setSelectedUser(null); setQuery(''); }} className="text-primary-400 hover:text-primary-700">✕</button>
                                </div>
                            )}

                            {/* Role dropdown */}
                            <div className="mb-6">
                                <label className="text-sm font-semibold text-neutral-700 mb-2 block">Their Role in Your Family</label>
                                <select
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value)}
                                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm bg-white"
                                >
                                    {FAMILY_ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-neutral-400 mt-1">This role is set by you and helps you organise your support network.</p>
                            </div>

                            <button
                                onClick={handleSendRequest}
                                disabled={sending || !selectedUser}
                                className="btn btn-primary w-full py-3 shadow-navy disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? 'Sending…' : 'Send Connection Request'}
                            </button>
                        </div>
                    )}

                    {tab === 'pending' && (
                        <div className="card space-y-8">
                            {/* Incoming */}
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-neutral-900">Incoming Requests</h2>
                                {loadingConns ? (
                                    <div className="text-center py-8 text-neutral-400">Loading…</div>
                                ) : pendingIncoming.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                        <div className="text-4xl mb-2">📬</div>
                                        <p className="font-medium text-neutral-600">No incoming requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingIncoming.map(conn => {
                                            // requester = person who sent the request
                                            const sender = conn.requester || {};
                                            const sName = sender.profiles?.full_name || sender.full_name || sender.email || 'Unknown';
                                            return (
                                                <div key={conn.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                                                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-lg shrink-0">
                                                        {sName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-neutral-800">{sName}</p>
                                                        <p className="text-xs text-neutral-400">{sender.email}</p>
                                                        <p className="text-xs text-neutral-500 mt-0.5">Wants to connect as family</p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button onClick={() => handleApprove(conn.id, sName)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">Accept</button>
                                                        <button onClick={() => handleReject(conn.id)} className="px-4 py-2 bg-neutral-100 hover:bg-red-50 text-red-600 text-sm font-semibold rounded-lg transition-colors">Decline</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Outgoing */}
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-neutral-900">Sent Requests</h2>
                                {pendingOutgoing.length === 0 ? (
                                    <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400">
                                        <div className="text-4xl mb-2">📤</div>
                                        <p className="font-medium text-neutral-600">No sent requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingOutgoing.map(c => {
                                            const u = c.connected_user || c.user || {};
                                            return (
                                                <div key={c.id} className="flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                                                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-lg shrink-0">
                                                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-neutral-800">{u.full_name || u.email || 'Unknown'}</p>
                                                        <p className="text-xs text-neutral-400">{u.email}</p>
                                                        <p className="text-xs text-neutral-500 mt-0.5">Awaiting their response</p>
                                                    </div>
                                                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-semibold">Pending</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
