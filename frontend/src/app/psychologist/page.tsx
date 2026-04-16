'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getConnections, getPatientDetails, approveConnection, rejectConnection, getMessages, sendMessage, getUnreadCounts, getSosContacts, approveSosContact, rejectSosContact, removeSosContact, getReceivedSosAlerts, deleteConnection } from '@/utils/api';
import { useAlert } from '@/context/AlertContext';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

export default function PsychologistDashboard() {
    const router = useRouter();
    const { showAlert, showConfirm } = useAlert();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientDetails, setPatientDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [patientInsights, setPatientInsights] = useState<string[]>([]);

    // Messaging states
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    // SOS states
    const [tab, setTab] = useState<'patients' | 'sos'>('patients');
    const [sosContacts, setSosContacts] = useState<any[]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);

    // Chart States (Cloned from Dashboard)
    const [trendData, setTrendData] = useState<any>(null);

    const verifyPsychologistAndFetch = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const userData = localStorage.getItem('user');
            if (!userData) {
                if (!isSilent) router.push('/login');
                return;
            }
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'psychologist') {
                if (!isSilent) router.push('/dashboard'); // Strict RBAC Client Redirect
                return;
            }

            setIsAuthorized(true);

            const conns = await getConnections();

            // Unread counts fetch
            try {
                const counts = await getUnreadCounts();
                const nextTotal = Object.values(counts || {}).reduce((a: number, b: any) => a + Number(b), 0);
                const prevTotal = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
                
                if (isSilent && nextTotal > prevTotal) {
                    showAlert('New message received!', 'info');
                }
                setUnreadCounts(counts || {});
            } catch (e) { }

            // Filter only approved connections where the other person is "user" representing a patient
            const approvedPatients = conns.filter((c: any) => c.status === 'approved' && c.connection_type === 'psychologist');
            const pRequests = conns.filter((c: any) => c.status === 'pending' && c.connection_type === 'psychologist');
            setPatients(approvedPatients);
            setPendingRequests(pRequests);

            // Fetch SOS Data
            try {
                const sContacts = await getSosContacts();
                const sAlerts = await getReceivedSosAlerts();
                setSosContacts(Array.isArray(sContacts) ? sContacts : []);
                setSosAlerts(Array.isArray(sAlerts) ? sAlerts : []);
            } catch (e) {
                console.error("Error fetching SOS data:", e);
            }
        } catch (error) {
            console.error("Psychologist error:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        verifyPsychologistAndFetch();

        // Real-time Dashboard Polling (every 5 seconds)
        const pollInterval = setInterval(() => {
            if (localStorage.getItem('token')) {
                verifyPsychologistAndFetch(true);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [router]);

    const handleSelectPatient = async (connectionId: string, patientUserId: string) => {
        setSelectedPatient(connectionId);
        setDetailsLoading(true);
        try {
            const details = await getPatientDetails(patientUserId);
            console.log('Fetched Patient Details:', details); // Diagnostic log
            setPatientDetails(details);
            generateInsights(details);
            prepareChartDataInternal(details);
        } catch (error) {
            showAlert('Could not fetch patient details. They may have removed authorization.', 'error');
        } finally {
            setDetailsLoading(false);
        }
    };

    const prepareChartDataInternal = (details: any) => {
        if (!details) return;

        // Prepare combined trend data - IDENTICAL TO DASHBOARD/PAGE.TSX
        const allLogs = [
            ...details.questionnaire_logs.map((log: any) => ({
                date: new Date(log.created_at),
                stress: parseFloat(log.stress_score || log.stress_level || 0),
                type: 'questionnaire',
            })),
            ...details.facial_logs.map((log: any) => ({
                date: new Date(log.created_at),
                stress: parseFloat(log.stress_score || log.stress_level || 0),
                type: 'facial',
            })),
        ].sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

        if (allLogs.length > 0) {
            // Filter logs to only those from the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const last7Days = allLogs.filter(log => log.date >= sevenDaysAgo);
            
            // If no logs in last 7 days, fallback to last 5 records so it's not empty, but label clearly
            const displayLogs = last7Days.length > 0 ? last7Days : allLogs.slice(-5);

            setTrendData({
                labels: displayLogs.map((log) =>
                    log.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                datasets: [
                    {
                        label: 'Stress Level',
                        data: displayLogs.map((log) => log.stress),
                        borderColor: 'rgb(30, 58, 138)',
                        backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2,
                    },
                ],
            });
        } else {
            setTrendData(null);
        }
    };

    const generateInsights = (details: any) => {
        if (!details) return;
        const newInsights: string[] = [];

        let qTotal = 0; let qSum = 0;
        let fTotal = 0; let fSum = 0;

        details.questionnaire_logs.forEach((log: any) => {
            qTotal++;
            qSum += parseFloat(log.stress_score || 0);
        });
        details.facial_logs.forEach((log: any) => {
            fTotal++;
            fSum += parseFloat(log.stress_score || 0);
        });

        if (qTotal === 0 && fTotal === 0) {
            setPatientInsights([]);
            return;
        }

        const avgQ = qTotal > 0 ? qSum / qTotal : 0;
        const avgF = fTotal > 0 ? fSum / fTotal : 0;
        const avgTotal = (avgQ + avgF) / (qTotal > 0 && fTotal > 0 ? 2 : 1);

        if (avgTotal < 40) {
            newInsights.push('Patient is showing low average stress levels.');
        } else if (avgTotal < 60) {
            newInsights.push('Patient has moderate stress levels.');
        } else {
            newInsights.push('⚠️ High stress levels detected. Intervention may be required.');
        }

        // Recent spike check
        const allLogs = [
            ...details.questionnaire_logs.map((log: any) => ({ stress: parseFloat(log.stress_score || 0), date: new Date(log.created_at) })),
            ...details.facial_logs.map((log: any) => ({ stress: parseFloat(log.stress_score || 0), date: new Date(log.created_at) }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        if (allLogs.length > 0 && allLogs[0].stress > 70) {
            newInsights.push('⚠️ Recent assessment showed a significant stress spike.');
        }

        setPatientInsights(newInsights);
    };

    const handleApprove = async (id: string) => {
        try {
            await approveConnection(id);
            showAlert('Connection request approved', 'success');
            verifyPsychologistAndFetch(true);
        } catch {
            showAlert('Failed to approve request', 'error');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectConnection(id);
            showAlert('Connection request rejected', 'info');
            verifyPsychologistAndFetch(true);
        } catch {
            showAlert('Failed to reject request', 'error');
        }
    };

    const handleSosApprove = async (id: string) => {
        try {
            await approveSosContact(id);
            showAlert('SOS Request approved!', 'success');
            verifyPsychologistAndFetch(true);
        } catch {
            showAlert('Failed to approve SOS request', 'error');
        }
    };

    const handleSosReject = async (id: string) => {
        try {
            await rejectSosContact(id);
            showAlert('SOS Request declined', 'info');
            verifyPsychologistAndFetch(true);
        } catch {
            showAlert('Failed to decline SOS request', 'error');
        }
    };

    const handleSosRemove = async (id: string) => {
        if (await showConfirm('Remove this person from your SOS contacts?')) {
            try {
                await removeSosContact(id);
                showAlert('SOS Contact removed', 'info');
                verifyPsychologistAndFetch(true);
            } catch {
                showAlert('Failed to remove SOS contact', 'error');
            }
        }
    };

    const handleRemovePatient = async (connectionId: string, name: string) => {
        if (await showConfirm(`Are you sure you want to remove ${name} from your patients? This will end your clinical connection and participation in their support network.`)) {
            try {
                await deleteConnection(connectionId);
                showAlert(`Patient ${name} removed`, 'info');
                setSelectedPatient(null);
                setPatientDetails(null);
                verifyPsychologistAndFetch(true);
            } catch {
                showAlert('Failed to remove patient', 'error');
            }
        }
    };

    const openChat = async (patientConnectionId: string) => {
        // Need to find the connection object for the selected patient
        const connectionObject = patients.find(p => p.id === patientConnectionId);
        if (!connectionObject) return;

        setActiveChat(connectionObject);
        // Clear unread optimistically
        setUnreadCounts(prev => ({ ...prev, [connectionObject.id]: 0 }));

        try {
            const msgs = await getMessages(connectionObject.id);
            setMessages(msgs || []);
        } catch (error) {
            showAlert('Failed to load messages', 'error');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChat) return;

        setSendingMessage(true);
        try {
            await sendMessage(activeChat.id, messageInput.trim());
            setMessageInput('');
            const msgs = await getMessages(activeChat.id);
            setMessages(msgs || []);
        } catch (error) {
            showAlert('Failed to send message', 'error');
        } finally {
            setSendingMessage(false);
        }
    };

    if (!isAuthorized) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
            // <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            //     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            //     <p className="text-neutral-600 font-medium">Loading your dashboard...</p>
            // </div>
        );
    }

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
                callbacks: {
                    label: (ctx: any) => ` Stress: ${ctx.parsed.y.toFixed(0)}/100`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: 100,
                ticks: { stepSize: 20 },
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
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
            x: { grid: { display: false } },
        },
    };

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50 pt-20 relative z-10 px-4 md:px-0">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:px-8 md:pt-4 md:pb-12">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl lg:text-4xl font-black text-neutral-900 mb-1">Clinical Dashboard</h1>
                        <p className="text-neutral-500 font-medium tracking-tight">Patient Support Network</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-2xl border border-neutral-200 flex gap-2 shadow-sm">
                         <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                             <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                             System Active
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Left Column (Roster / SOS) */}
                    <div className={`lg:col-span-1 bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col relative group ${selectedPatient ? 'hidden lg:flex' : 'flex'} h-[calc(100vh-150px)] lg:h-[calc(100vh-250px)]`}>
                        <div className="flex bg-neutral-50 p-1.5 border-b border-neutral-100 z-10">
                            <button
                                onClick={() => setTab('patients')}
                                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all relative ${tab === 'patients' ? 'bg-white text-primary-700 shadow-soft-md' : 'text-neutral-400 hover:text-neutral-600'}`}
                            >
                                Patients
                                {pendingRequests.length > 0 && <span className="ml-2 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">{pendingRequests.length}</span>}
                                {Object.values(unreadCounts).some(c => c > 0) && tab !== 'patients' && (
                                    <span className="absolute top-2 right-2 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setTab('sos')}
                                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 relative ${tab === 'sos' ? 'bg-red-50 text-red-600 shadow-soft-sm' : 'text-neutral-400 hover:text-red-500'}`}
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                SOS Alerts
                                {(sosContacts.filter(c => c.status === 'pending' && c.is_incoming).length > 0 || sosAlerts.filter(s => !s.is_read).length > 0) && (
                                    <span className="absolute top-2 right-2 sm:right-6 lg:right-2 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2 z-10 w-full">
                            {tab === 'patients' ? (
                                <>
                                    {/* Pending Requests Block */}
                                    {pendingRequests.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3 px-2">Action Required</h3>
                                            {pendingRequests.map(req => {
                                                const patientName = req.requester?.profiles?.full_name || req.requester?.email || 'Anonymous Patient';
                                                return (
                                                    <div key={req.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-2 shadow-sm">
                                                        <div className="font-bold text-neutral-900 text-sm mb-3">{patientName}</div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleApprove(req.id)} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm">
                                                                Accept
                                                            </button>
                                                            <button onClick={() => handleReject(req.id)} className="flex-1 bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200 text-xs font-bold py-2 rounded-xl transition-colors shadow-sm">
                                                                Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2">Active Patients</h3>
                                    {patients.length === 0 && (
                                        <div className="text-neutral-500 text-center mt-10 p-4 border-2 border-dashed border-primary-100 rounded-3xl">
                                            You have no connected patients yet. Users must initiate a connection request to you.
                                        </div>
                                    )}
                                    {patients.map((p) => {
                                        const rawUser = JSON.parse(localStorage.getItem('user') || '{}');
                                        const isPatientUserField = p.user_id !== rawUser.id; // true if the patient requested the connection
                                        const patientId = p.user_id === rawUser.id ? p.connected_user_id : p.user_id;
                                        
                                        // If patient requested, they are the requester. If psycho requested, patient is connected_user.
                                        const patientData = isPatientUserField ? p.requester : p.connected_user;
                                        const patientName = patientData?.profiles?.full_name || patientData?.email || 'Anonymous Patient';

                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectPatient(p.id, patientId)}
                                                className={`text-left p-4 rounded-2xl transition-all border ${selectedPatient === p.id ? 'border-primary-300 bg-primary-50/50 shadow-md transform scale-[1.02]' : 'border-neutral-100 hover:border-primary-200 hover:bg-white hover:shadow-soft-md'} relative w-full`}
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-bold pr-6 flex items-center gap-2 ${selectedPatient === p.id ? 'text-primary-800' : 'text-neutral-900'}`}>
                                                            {patientName}
                                                            {(unreadCounts[p.id] || 0) > 0 && (
                                                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse flex-shrink-0" title="New Message"></span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-medium text-neutral-500 truncate mt-1">Connection #{p.id.slice(0, 8)}</div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemovePatient(p.id, patientName);
                                                        }}
                                                        className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Remove Patient"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            ) : (
                                /* ── SOS ALERTS TAB ── */
                                <div className="space-y-4">
                                    {/* Incoming SOS Requests */}
                                    {sosContacts.filter(c => c.status === 'pending' && c.is_incoming).length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                SOS Requests
                                            </h3>
                                            {sosContacts.filter(c => c.status === 'pending' && c.is_incoming).map(req => {
                                                let userName = req.user?.profiles?.full_name || req.user?.email || 'Anonymous Patient';
                                                
                                                // Handle Supabase returning an array for profiles in some schemas
                                                if (Array.isArray(req.user?.profiles) && req.user.profiles.length > 0) {
                                                    userName = req.user.profiles[0].full_name || userName;
                                                }
                                                
                                                return (
                                                    <div key={req.id} className="bg-red-50 border border-red-100 rounded-xl p-3 mb-2">
                                                        <div className="font-bold text-red-900 text-sm mb-2">{userName}</div>
                                                        <div className="text-xs text-red-700 mb-3 leading-tight">Wants to add you as their SOS contact.</div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleSosApprove(req.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">Accept</button>
                                                            <button onClick={() => handleSosReject(req.id)} className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-bold py-1.5 rounded-lg transition-colors">Decline</button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-2">Active SOS Alerts</h3>
                                    {sosAlerts.filter(s => !s.is_read).length === 0 ? (
                                        <p className="text-sm text-neutral-500 px-2 italic">No active SOS alerts right now.</p>
                                    ) : (
                                        sosAlerts.filter(s => !s.is_read).map(alert => {
                                            const sender = alert.sender || {};
                                            const name = sender.profiles?.full_name || sender.full_name || sender.email || 'Someone';
                                            return (
                                                <div key={alert.id} className="bg-white border border-red-200 shadow-sm rounded-xl p-4 overflow-hidden relative">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-red-700">{name}</span>
                                                        <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase">Active Alert</span>
                                                    </div>
                                                    <p className="text-xs text-neutral-600 mb-3 line-clamp-2">"{alert.message || 'Emergency assistance requested'}"</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                const conn = patients.find(p => p.connected_user_id === alert.sender_id || p.user_id === alert.sender_id);
                                                                if (conn) handleSelectPatient(conn.id, alert.sender_id);
                                                            }}
                                                            className="flex-1 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg"
                                                        >View Details</button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-6 mb-2 px-2">SOS Roster</h3>
                                    {sosContacts.filter(c => c.status === 'approved' && c.is_incoming).length === 0 ? (
                                        <p className="text-sm text-neutral-500 px-2 italic">You are not an SOS contact for any patients.</p>
                                    ) : (
                                        sosContacts.filter(c => c.status === 'approved' && c.is_incoming).map(c => {
                                            const person = c.user;
                                            const name = person.profiles?.full_name || person.full_name || person.email || 'Patient';
                                            return (
                                                <div key={c.id} className="flex justify-between items-center p-3 hover:bg-neutral-50 border border-neutral-100 rounded-xl transition-all mb-2">
                                                    <span className="font-medium text-sm text-neutral-800">{name}</span>
                                                    <div className="flex gap-2 border-l border-neutral-200 pl-2">
                                                        <button
                                                            onClick={() => {
                                                                const conn = patients.find(p => p.connected_user_id === c.user_id || p.user_id === c.user_id);
                                                                if (conn) handleSelectPatient(conn.id, c.user_id);
                                                            }}
                                                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" title="View Details"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        </button>
                                                        <button onClick={() => handleSosRemove(c.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Stop Receiving Alerts">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Details Column */}
                    <div className={`lg:col-span-2 h-[calc(100vh-150px)] lg:h-[calc(100vh-250px)] overflow-y-auto ${!selectedPatient ? 'hidden lg:block' : 'block'}`}>
                        {detailsLoading ? (
                            <div className="h-full min-h-[300px] flex items-center justify-center bg-white rounded-2xl shadow-sm border border-neutral-200 p-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>

                            </div>
                        ) : !selectedPatient || !patientDetails ? (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center text-neutral-400">
                                <div className="w-20 h-20 mb-6 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-700 mb-2">No Patient Selected</h3>
                                <p className="text-neutral-500 max-w-sm">Select a patient from the roster to view their clinical details, stress trends, and SOS alerts.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col min-h-full relative overflow-hidden">
                                <div className="p-6 md:p-8 border-b border-neutral-100 bg-white flex flex-col z-10 shadow-sm relative">
                                    {/* Mobile Back Button */}
                                    <button
                                        onClick={() => { setSelectedPatient(null); setPatientDetails(null); }}
                                        className="lg:hidden mb-6 text-neutral-500 hover:text-neutral-700 font-semibold flex items-center gap-1 self-start"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Roster
                                    </button>
                                    <div className="flex flex-col xl:flex-row justify-between items-start gap-4">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-14 h-14 shrink-0 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
                                                {patientDetails.patient?.profile?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight truncate">{patientDetails.patient?.profile?.full_name || 'Unknown Patient'}</h2>
                                                <p className="text-xs font-bold text-neutral-400 tracking-wide uppercase mt-1 truncate">{patientDetails.patient?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                                            <button
                                                onClick={() => openChat(selectedPatient)}
                                                className="bg-primary-600 hover:bg-primary-700 w-full sm:w-36 justify-center text-white shadow-soft-sm px-4 font-black uppercase tracking-widest text-[10px] py-3 flex items-center gap-2 rounded-xl transition-all relative"
                                            >
                                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                <span>Message</span>
                                                {(unreadCounts[selectedPatient] || 0) > 0 && (
                                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                                                    </span>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleRemovePatient(selectedPatient, patientDetails.patient?.profile?.full_name || 'Patient')}
                                                className="bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 w-full sm:w-36 justify-center px-4 font-black uppercase tracking-widest text-[10px] py-3 flex items-center gap-2 rounded-xl transition-all"
                                            >
                                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                <span>Remove</span>
                                            </button>

                                            {patientDetails.sos_alerts?.filter((s: any) => s.status === 'active').length > 0 && (
                                                <span className="bg-red-500 text-white flex-1 sm:flex-none justify-center px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-soft-sm animate-pulse flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    ACTIVE SOS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Patient Profile Details Component */}
                                <div className="p-6 md:p-8 border-b border-neutral-100 bg-neutral-50/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        <div><span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1">Phone Number</span><span className="text-neutral-900 text-sm font-medium">{patientDetails.patient?.profile?.phone || 'Not provided'}</span></div>
                                        <div><span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1">Date of Birth</span><span className="text-neutral-900 text-sm font-medium">{patientDetails.patient?.profile?.date_of_birth ? new Date(patientDetails.patient.profile.date_of_birth).toLocaleDateString() : 'Not provided'}</span></div>
                                        <div><span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1">Member Since</span><span className="text-neutral-900 text-sm font-medium">{patientDetails.patient?.created_at ? new Date(patientDetails.patient.created_at).toLocaleDateString() : 'Unknown'}</span></div>

                                        <div className="sm:col-span-2 md:col-span-3">
                                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Emergency Contact</span>
                                            {patientDetails.patient?.profile?.emergency_contact_name ? (
                                                <div className="bg-red-50 border border-red-100 rounded-lg p-3 inline-block">
                                                    <span className="text-red-900 font-bold block">{patientDetails.patient.profile.emergency_contact_name}</span>
                                                    <span className="text-red-700">{patientDetails.patient.profile.emergency_contact_phone || ''}</span>
                                                </div>
                                            ) : (
                                                <span className="text-neutral-500 text-sm italic">None provided</span>
                                            )}
                                        </div>

                                        <div className="sm:col-span-2 md:col-span-3">
                                            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 block mb-1.5">Bio / Notes</span>
                                            <p className="text-neutral-800 text-sm bg-white p-4 rounded-xl border border-neutral-200">{patientDetails.patient?.profile?.bio || 'No notes available from this user.'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Charts Row exactly like User Dashboard */}
                                    {/* 7-Day Stress Trend - Full Width */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg md:text-xl font-semibold mb-4 text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>7-Day Stress Trend
                                        </h3>
                                        <div className="h-64 sm:h-80 w-full bg-white rounded-2xl p-4 border border-neutral-100 shadow-sm">
                                            {trendData ? (
                                                <Line data={trendData} options={lineChartOptions} />
                                            ) : (
                                                <div className="h-full flex items-center justify-center bg-neutral-50 rounded-xl border border-neutral-100 shadow-sm">
                                                    <div className="text-center text-neutral-400">
                                                        <div className="text-4xl mb-2">📊</div>
                                                        <p className="text-sm">No trend data yet</p>
                                                        <p className="text-xs mt-1">Patient needs to complete assessments</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actionable Insights */}
                                    {patientInsights.length > 0 && (
                                        <div className="md:col-span-2">
                                            <h3 className="text-lg font-black text-neutral-900 mb-4 border-b border-neutral-100 pb-3 flex items-center gap-2 uppercase tracking-widest text-[11px]">
                                                <div className="w-1.5 h-3.5 bg-primary-500 rounded-full"></div>
                                                Clinical Insights
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {patientInsights.map((insight, idx) => (
                                                    <div key={idx} className={`p-4 rounded-2xl text-[13px] leading-relaxed font-bold border shadow-soft-sm ${insight.includes('⚠️') ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-primary-50 text-primary-800 border-primary-100'}`}>
                                                        {insight}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Activity History */}
                                    {/* <div>
                                        <h3 className="text-lg font-bold text-neutral-800 mb-4 border-b border-neutral-100 pb-2">Recent Wellness Activities</h3>
                                        {patientDetails.activity_history.length > 0 ? (
                                            <ul className="space-y-3">
                                                {patientDetails.activity_history.map((act: any) => (
                                                    <li key={act.id} className="bg-green-50 text-green-800 p-3 rounded-xl text-sm border border-green-100">
                                                        <div className="font-bold">{act.wellness_activities?.title}</div>
                                                        <div className="text-green-600/80 mt-1">{new Date(act.created_at).toLocaleDateString()} - {act.duration_seconds / 60} mins</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-neutral-400 italic text-sm">No recorded activities.</p>
                                        )}
                                    </div> */}

                                    {/* Logs Summary */}
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-800 mb-4 border-b border-neutral-100 pb-2">SOS Alerts</h3>
                                        {patientDetails.sos_alerts.length > 0 ? (
                                            <ul className="space-y-3">
                                                {patientDetails.sos_alerts.map((sos: any) => (
                                                    <li key={sos.id} className={`p-3 rounded-xl text-sm border ${!sos.is_read ? 'bg-red-50 text-red-800 border-red-200' : 'bg-neutral-50 text-neutral-600 border-neutral-200'}`}>
                                                        <div className="font-bold">Triggered on {new Date(sos.created_at).toLocaleDateString()}</div>
                                                        <div className="mt-1">Status: {sos.is_read ? 'ACKNOWLEDGED' : 'ACTIVE'}</div>
                                                        {sos.message && <div className="mt-1 italic">"{sos.message}"</div>}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-neutral-400 italic text-sm">No SOS alerts on record.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Chat Modal / Slide-out */}
            {activeChat && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 flex flex-col animate-fade-in">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-neutral-100 bg-primary-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                                {activeChat.user?.profiles?.full_name?.charAt(0) || 'P'}
                            </div>
                            <div>
                                <h3 className="font-bold">{activeChat.user?.profiles?.full_name || 'Patient'}</h3>
                                <p className="text-xs text-primary-200">Secure Direct Message</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-neutral-50 flex flex-col gap-3">
                        {messages.length === 0 ? (
                            <div className="m-auto text-neutral-400 text-sm text-center bg-white p-4 rounded-xl border border-neutral-100">
                                This is the beginning of your secure chat history with this patient.
                            </div>
                        ) : messages.map((msg) => {
                            const rawUser = JSON.parse(localStorage.getItem('user') || '{}');
                            const isMe = msg.sender_id === rawUser.id;

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm'}`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-neutral-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 bg-white flex gap-2">
                        <input
                            type="text"
                            className="input flex-1 bg-neutral-100 border-none focus:ring-primary-500"
                            placeholder="Type a secure message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={sendingMessage || !messageInput.trim()}
                            className="bg-primary-600 text-white w-12 h-12 flex items-center justify-center rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
