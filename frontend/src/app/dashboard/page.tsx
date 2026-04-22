
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
    getQuestionnaireStats, getQuestionnaireLogs,
    getFacialEmotionStats, getFacialEmotionLogs,
    getConnections,
    getFamilyConnectionCount,
    getProfile,
} from '@/utils/api';
import { getStoredToken, getStoredUser, updateStoredUser } from '@/utils/storage';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        questionnaireCount: 0,
        facialScansCount: 0,
        avgQuestionnaireStress: 0,
        avgFacialStress: 0,
        psychologistConnections: 0,
        familyConnections: 0,
    });
    const [trendData, setTrendData] = useState<any>(null);
    const [stressDistribution, setStressDistribution] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [insights, setInsights] = useState<string[]>([]);
    // Separate dismissable warnings for each source
    const [showFacialWarning, setShowFacialWarning] = useState(false);
    const [showQuestWarning, setShowQuestWarning] = useState(false);
    const [facialAvg10, setFacialAvg10] = useState(0);
    const [questAvg10, setQuestAvg10] = useState(0);

    useEffect(() => {
        const token = getStoredToken();
        const userData = getStoredUser();

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            const parsedUser = userData;

            // Redirect Admins and Psychologists away from standard user dashboard
            if (parsedUser.role === 'admin' || parsedUser.role === 'super_admin') {
                router.push('/admin');
                return;
            } else if (parsedUser.role === 'psychologist') {
                router.push('/psychologist');
                return;
            }

            setUser(parsedUser);
            setIsAuthorized(true);
        }

        fetchDashboardData();
    }, [router]);

    const fetchDashboardData = async () => {
        try {
            // Fetch all stats in parallel
            const [qStats, fStats, connections, qLogs, fLogs, profileData, familyCount] = await Promise.all([
                getQuestionnaireStats().catch(() => ({ total_assessments: 0, average_stress_score: 0 })),
                getFacialEmotionStats().catch(() => ({ total_scans: 0, average_stress_level: 0 })),
                getConnections().catch(() => []),
                getQuestionnaireLogs().catch(() => []),
                getFacialEmotionLogs().catch(() => []),
                getProfile().catch(() => null),
                getFamilyConnectionCount().catch(() => 0),
            ]);

            // Update user name in case localStorage didn't have it
            if (profileData && profileData.profile && profileData.profile.full_name) {
                setUser((prev: any) => ({ ...prev, full_name: profileData.profile.full_name }));
                const currentLocal = getStoredUser() || {};
                // Ensure name persists across refreshes
                if (!currentLocal.full_name) {
                    const updated = { ...currentLocal, full_name: profileData.profile.full_name };
                    updateStoredUser(updated);
                }
            }

            // Dynamic averages computed from actual log data
            const avgQStress = qLogs.length
                ? qLogs.reduce((s: number, l: any) => s + parseFloat(l.stress_score || 0), 0) / qLogs.length
                : 0;
            const avgFStress = fLogs.length
                ? fLogs.reduce((s: number, l: any) => s + parseFloat(l.stress_score || 0), 0) / fLogs.length
                : 0;

            // Split connections by type (connections table = psychologist only)
            const connArray = Array.isArray(connections) ? connections : [];
            const psychCount = connArray.filter((c: any) => c.connection_type === 'psychologist').length;

            // Set stats
            setStats({
                questionnaireCount: qStats.total_assessments || 0,
                facialScansCount: fStats.total_scans || 0,
                avgQuestionnaireStress: avgQStress,
                avgFacialStress: avgFStress,
                psychologistConnections: psychCount,
                familyConnections: typeof familyCount === 'number' ? familyCount : 0,
            });

            // Prepare combined trend data
            const allLogs = [
                ...qLogs.map((log: any) => ({
                    date: new Date(log.created_at),
                    stress: parseFloat(log.stress_score || 0),  // questionnaire uses stress_score
                    type: 'questionnaire',
                })),
                ...fLogs.map((log: any) => ({
                    date: new Date(log.created_at),
                    stress: parseFloat(log.stress_score || 0),  // facial also uses stress_score (not stress_level)
                    type: 'facial',
                })),
            ].sort((a, b) => a.date.getTime() - b.date.getTime());

            if (allLogs.length > 0) {
                // Filter logs to only those from the last 15 days
                const fifteenDaysAgo = new Date();
                fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
                const last15Days = allLogs.filter((log) => log.date >= fifteenDaysAgo);

                // Fallback to show more points if recent data is sparse
                // We show all logs in last 15 days, OR at least the last 10 logs total
                const displayLogs = last15Days.length >= 5 ? last15Days : allLogs.slice(-15);

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
                        },
                    ],
                });

                // Stress distribution — 0-100 scale
                const lowStress = allLogs.filter((log) => log.stress < 40).length;
                const mediumStress = allLogs.filter((log) => log.stress >= 40 && log.stress < 70).length;
                const highStress = allLogs.filter((log) => log.stress >= 70).length;

                setStressDistribution({
                    labels: ['Low Stress', 'Medium Stress', 'High Stress'],
                    datasets: [
                        {
                            data: [lowStress, mediumStress, highStress],
                            backgroundColor: [
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(251, 191, 36, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                            ],
                            borderColor: ['rgb(34, 197, 94)', 'rgb(251, 191, 36)', 'rgb(239, 68, 68)'],
                            borderWidth: 2,
                        },
                    ],
                });
            }

            // Recent activity
            const recent = [
                ...qLogs.map((log: any) => ({ ...log, type: 'questionnaire' })),
                ...fLogs.map((log: any) => ({ ...log, type: 'facial' })),
            ]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 20);

            setRecentActivity(recent);

            // ── Compute last-10 averages for warnings ──────────────────────
            const last10Facial = fLogs.slice(0, 10);
            const last10Quest = qLogs.slice(0, 10);

            const avgF10 = last10Facial.length
                ? last10Facial.reduce((s: number, l: any) => s + parseFloat(l.stress_score || 0), 0) / last10Facial.length
                : 0;
            const avgQ10 = last10Quest.length
                ? last10Quest.reduce((s: number, l: any) => s + parseFloat(l.stress_score || 0), 0) / last10Quest.length
                : 0;

            setFacialAvg10(avgF10);
            setQuestAvg10(avgQ10);
            if (avgF10 > 65) setShowFacialWarning(true);
            if (avgQ10 > 65) setShowQuestWarning(true);

            // Generate insights
            generateInsights(qStats, fStats, allLogs);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateInsights = (qStats: any, fStats: any, logs: any[]) => {
        const newInsights: string[] = [];

        // 3. notification / popups should only appear after analyzing something
        if (qStats.total_assessments === 0 && fStats.total_scans === 0) {
            setInsights([]); // Set empty so it doesn't show at all
            return;
        }

        // Average stress insight - Only evaluate if there's actually data
        if (qStats.total_assessments > 0 || fStats.total_scans > 0) {
            const avgStress = (qStats.average_stress_score + fStats.average_stress_level) / 2;
            if (avgStress < 40) {
                newInsights.push('🎉 Great job! Your average stress levels are low. Keep up the good work!');
            } else if (avgStress < 50) {
                newInsights.push('⚠️ Your stress levels are moderate. Consider trying wellness activities.');
            } else {
                newInsights.push('🚨 Your stress levels are high. We recommend connecting with a psychologist.');
            }

            // Trend insight
            if (logs.length >= 2) {
                const recent = logs.slice(-3).reduce((sum, log) => sum + log.stress, 0) / 3;
                const older = logs.slice(-6, -3).reduce((sum, log) => sum + log.stress, 0) / 3;
                if (recent < older) {
                    newInsights.push('📉 Positive trend! Your stress levels are decreasing.');
                } else if (recent > older) {
                    newInsights.push('📈 Your stress levels are increasing. Take time for self-care.');
                }
            }
        }

        setInsights(newInsights);
    };

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

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                        weight: 'bold' as const
                    },
                },
            },
        },
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
        );
    }

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 pt-20 pb-8">
                <div className="container-custom max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    {/* 4. name of user should be written with welcome back */}
                    <div className="mb-8 mt-6">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                            Welcome back, {user?.full_name || 'User'} <span className="text-3xl sm:text-4xl ml-1">👋</span>
                        </h1>
                        <p className="text-neutral-600 text-sm sm:text-base">
                            Here's your mental wellness overview
                        </p>
                    </div>

                    {/* ── Stress Warnings (last-10 avg > 65) ── */}
                    {(showFacialWarning || showQuestWarning) && (
                        <div className="mb-6 space-y-3">
                            {showFacialWarning && (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                                    <span className="text-xl shrink-0">🚨</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-red-800 text-sm">High Facial Stress Detected</p>
                                        <p className="text-red-700 text-sm mt-0.5">
                                            Your average facial stress score over the last 10 scans is <strong>{facialAvg10.toFixed(1)}/100</strong>.
                                            Consider speaking with a psychologist.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowFacialWarning(false)}
                                        className="shrink-0 text-red-400 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
                                        aria-label="Dismiss facial warning"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {showQuestWarning && (
                                <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
                                    <span className="text-xl shrink-0">⚠️</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-orange-800 text-sm">High Questionnaire Stress Detected</p>
                                        <p className="text-orange-700 text-sm mt-0.5">
                                            Your average questionnaire stress score over the last 10 assessments is <strong>{questAvg10.toFixed(1)}/100</strong>.
                                            Try some wellness activities or reach out for support.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowQuestWarning(false)}
                                        className="shrink-0 text-orange-400 hover:text-orange-700 transition-colors p-1 rounded-full hover:bg-orange-100"
                                        aria-label="Dismiss questionnaire warning"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
                        {[
                            { label: 'Questionnaire Assessments', value: stats.questionnaireCount, color: 'bg-blue-600' },
                            { label: 'Facial Scans Analyzed', value: stats.facialScansCount, color: 'bg-violet-600' },
                            { label: 'Avg Questionnaire Stress', value: stats.avgQuestionnaireStress.toFixed(1), color: 'bg-emerald-600' },
                            { label: 'Avg Facial Stress Score', value: stats.avgFacialStress.toFixed(1), color: 'bg-orange-600' },
                            { label: 'Connected Psychologists', value: stats.psychologistConnections, color: 'bg-indigo-600' },
                            { label: 'Connected Family Members', value: stats.familyConnections, color: 'bg-pink-600' },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className={`${stat.color} rounded-xl p-5 text-white shadow-sm flex flex-col h-full min-h-[110px]`}
                            >
                                <div className="text-xs font-semibold opacity-90 mb-2 leading-tight uppercase tracking-wide">
                                    {stat.label}
                                </div>
                                <div className="text-3xl font-bold mt-auto">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Stress Trend Chart */}
                        <div className="lg:col-span-2 card">
                            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-neutral-900">
                                15-Day Stress Trend
                            </h3>
                            <div className="h-64 sm:h-80">
                                {trendData ? (
                                    <Line data={trendData} options={lineChartOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
                                        <div className="text-center text-neutral-400">
                                            <div className="text-4xl mb-2">📊</div>
                                            <p className="text-sm">No trend data yet</p>
                                            <p className="text-xs mt-1">Complete assessments to see trends</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stress Distribution */}
                        <div className="card">
                            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-neutral-900">
                                Stress Distribution
                            </h3>
                            <div className="h-64 sm:h-80">
                                {stressDistribution ? (
                                    <Doughnut data={stressDistribution} options={doughnutOptions} />
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg">
                                        <div className="text-center text-neutral-400">
                                            <div className="text-4xl mb-2">📈</div>
                                            <p className="text-sm">No data available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity & Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4 items-stretch">
                        {/* Recent Activity */}
                        <div className="card flex flex-col h-full">
                            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-neutral-900">
                                Recent Activity
                            </h3>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 flex-1">
                                    {recentActivity.map((log, index) => {
                                        const score = parseFloat(log.stress_score || 0);
                                        const isHigh = score > 70;
                                        const isMid = score > 40;
                                        const isQuest = log.type === 'questionnaire';
                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors border border-neutral-100"
                                            >
                                                {/* Icon */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${isQuest ? 'bg-primary-100' : 'bg-violet-100'}`}>
                                                    {isQuest ? '📝' : '🎭'}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm text-neutral-900">
                                                        {isQuest ? 'Questionnaire' : 'Facial Scan'}
                                                    </div>
                                                    <div className="text-xs text-neutral-400">
                                                        {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                {/* Score */}
                                                <div className={`text-right shrink-0`}>
                                                    <div className={`text-lg font-black ${isHigh ? 'text-red-600' : isMid ? 'text-orange-500' : 'text-green-600'}`}>
                                                        {score.toFixed(0)}
                                                        <span className="text-xs font-normal opacity-50 ml-0.5">/100</span>
                                                    </div>
                                                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block
                                                        ${isHigh ? 'bg-red-50 text-red-600' : isMid ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                                        {isHigh ? 'High' : isMid ? 'Mid' : 'Low'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                    <div className="text-5xl mb-4">🎯</div>
                                    <p className="text-neutral-500 font-medium">No activity yet</p>
                                    <p className="text-neutral-400 text-sm mt-1">Complete a scan or assessment to see activity here</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="card flex flex-col">
                            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-neutral-900">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                {([
                                    { href: '/questionnaire', emoji: '📝', label: 'Questionnaire', desc: 'Take stress assessment', color: 'bg-blue-50 hover:bg-blue-100 border-blue-100' },
                                    { href: '/facial-emotion', emoji: '🎭', label: 'Facial Scan', desc: 'AI emotion detection', color: 'bg-violet-50 hover:bg-violet-100 border-violet-100' },
                                    { href: '/chatbot', emoji: '💬', label: 'AI Chatbot', desc: 'Talk to your assistant', color: 'bg-green-50 hover:bg-green-100 border-green-100' },
                                    { href: '/wellness', emoji: '🧘', label: 'Wellness', desc: 'Relaxation activities', color: 'bg-teal-50 hover:bg-teal-100 border-teal-100' },
                                    { href: '/family', emoji: '👨‍👩‍👧‍👦', label: 'Connect with family', desc: 'Manage your SOS network', color: 'bg-orange-50 hover:bg-orange-100 border-orange-100' },
                                    { href: '/sos', emoji: '🚨', label: 'SOS', desc: 'Emergency support', color: 'bg-red-50 hover:bg-red-100 border-red-100' },
                                ] as const).map(({ href, emoji, label, desc, color }) => (
                                    <Link key={href} href={href} className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 ${color}`}>
                                        <div className="text-2xl mb-1">{emoji}</div>
                                        <h4 className="font-semibold text-sm text-neutral-800">{label}</h4>
                                        <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Assistant Floating Button */}
                <Link
                    href="/chatbot"
                    className="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center group"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="hidden group-hover:block font-medium pr-2 whitespace-nowrap">AI Assistant</span>
                    </div>
                </Link>
            </main>

            <Footer />
        </>
    );
}

