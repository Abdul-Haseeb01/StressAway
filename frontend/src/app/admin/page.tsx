'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { 
    getAdminStats, getAllUsers, updateUserRole, deactivateUser, activateUser, 
    getContactMessages, updateContactStatus, updateUserProfile, getUserDetails,
    getAdminQuestions, updateAdminQuestion, createAdminQuestion, deleteAdminQuestion
} from '@/utils/api';
import { getStoredToken, getStoredUser } from '@/utils/storage';
import { useAlert } from '@/context/AlertContext';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

export default function AdminDashboard() {
    const router = useRouter();
    const { showAlert, showConfirm } = useAlert();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'psychologists' | 'admins' | 'questions' | 'help'>('users');

    // Help Center / Contact Messages
    const [contactMessages, setContactMessages] = useState<any[]>([]);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);

    // Questionnaire Management
    const [questions, setQuestions] = useState<any[]>([]);
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

    // Detailed View States (Charts)
    const [trendData, setTrendData] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});

    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchAdminData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const parsedUser = getStoredUser();
            if (!parsedUser) {
                router.push('/login');
                return;
            }
            setCurrentUser(parsedUser);
            if (parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
                router.push('/dashboard'); // Strict RBAC Client Redirect
                return;
            }

            setIsAuthorized(true);

            const [statsRes, usersRes] = await Promise.all([
                getAdminStats(),
                getAllUsers(),
            ]);

            setStats(statsRes);
            setUsers(usersRes);

            // Fetch Questionnaire Questions
            try {
                const qData = await getAdminQuestions();
                setQuestions(qData.sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0)));
            } catch (err) {
                console.error("Failed to fetch questions", err);
            }

            // Fetch Contact Messages (Help Center)
            try {
                const mData = await getContactMessages();
                setContactMessages(mData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } catch (err) {
                console.error("Failed to fetch contact messages", err);
            }

        } catch (error) {
            console.error("Admin error:", error);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, [router]);

    const handleRoleChange = async (userId: string, targetRole: string) => {
        const confirmed = await showConfirm(`Are you sure you want to change this user's role to ${targetRole}?`);
        if (!confirmed) return;
        try {
            await updateUserRole(userId, targetRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: targetRole } : u));
            showAlert(`User role successfully changed to ${targetRole}`, 'success');
        } catch (error) {
            showAlert('Failed to update user role', 'error');
        }
    };

    const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
        const confirmed = await showConfirm(`Are you sure you want to ${currentlyActive ? 'deactivate' : 'activate'} this user's account?`);
        if (!confirmed) return;
        try {
            if (currentlyActive) {
                await deactivateUser(userId);
            } else {
                await activateUser(userId);
            }
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentlyActive } : u));
            showAlert(`User account successfully ${currentlyActive ? 'deactivated' : 'activated'}`, 'success');
        } catch (error) {
            showAlert('Failed to toggle active status', 'error');
        }
    }

    const handleVerifyPsychologist = async (id: string, status: string) => {
        if (await showConfirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this psychologist?`)) {
            try {
                await updateUserProfile(id, { verification_status: status });
                showAlert(`Psychologist ${status} successfully.`, 'success');
                // Re-fetch details to update UI
                handleUserClick(id);
                // Also trigger stats refresh in background
                fetchAdminData(true);
            } catch (error: any) {
                showAlert(error.response?.data?.message || 'Failed to update verification status.', 'error');
            }
        }
    };

    const canEditUser = (targetUser: any) => {
        if (!currentUser || !currentUser.id) return false;
        if (!targetUser || !targetUser.id) return false; // Fixed TypeError: undefined object parsing
        if (currentUser.id === targetUser.id) return false; // Cannot edit self
        if (currentUser.role === 'super_admin') return true; // super_admin can edit anyone else
        if (currentUser.role === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) return false; // admin cannot edit other admins
        return true;
    };

    const displayedUsers = users.filter((u) => {
        if (activeTab === 'users') return (!u.role || u.role === 'user');
        if (activeTab === 'psychologists') return u.role === 'psychologist';
        if (activeTab === 'admins') return (u.role === 'admin' || u.role === 'super_admin');
        return true;
    });

    const handleUserClick = async (userId: string) => {
        setSelectedUser(userId);
        setDetailsLoading(true);
        setIsEditingProfile(false);
        try {
            const data = await getUserDetails(userId);
            setSelectedUserDetails(data);
            setEditFormData(data.profile || {});

            // Prepare Chart Data (identical logic to user dashboard)
            const allLogs = [
                ...(data.recent_questionnaire_logs || []).map((log: any) => ({
                    date: new Date(log.created_at),
                    stress: parseFloat(log.stress_score || log.stress_level || 0),
                })),
                ...(data.recent_facial_logs || []).map((log: any) => ({
                    date: new Date(log.created_at),
                    stress: parseFloat(log.stress_score || log.stress_level || 0),
                })),
            ].sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

            if (allLogs.length > 0) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const last7Days = allLogs.filter((log) => log.date >= sevenDaysAgo);
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
                            pointBackgroundColor: '#fff',
                            pointBorderWidth: 2,
                        },
                    ],
                });
            } else {
                setTrendData(null);
            }
        } catch (error) {
            showAlert('Failed to load user details', 'error');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingQuestion?.id) {
                await updateAdminQuestion(editingQuestion.id, editingQuestion);
            } else {
                await createAdminQuestion(editingQuestion);
            }
            showAlert(`Question ${editingQuestion?.id ? 'updated' : 'created'} successfully`, 'success');
            setIsQuestionModalOpen(false);
            // Refresh
            const qData = await getAdminQuestions();
            setQuestions(qData);
        } catch (error) {
            showAlert('Failed to save question', 'error');
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!await showConfirm('Are you sure you want to delete this question?')) return;
        try {
            await deleteAdminQuestion(id);
            setQuestions(questions.filter(q => q.id !== id));
            showAlert('Question deleted', 'success');
        } catch (error) {
            showAlert('Deletion failed', 'error');
        }
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: 100,
                ticks: { stepSize: 20 },
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
    };

    const handleCloseDetails = () => {
        setSelectedUser(null);
        setSelectedUserDetails(null);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation logic for Admin edits
        const phoneRegex = /^(\+92|0)\d{10}$/;
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

        if (editFormData.phone && !phoneRegex.test(editFormData.phone)) {
            showAlert('Phone number must be in format +923000000000 or 03000000000', 'error');
            return;
        }
        if (editFormData.emergency_contact_phone && !phoneRegex.test(editFormData.emergency_contact_phone)) {
            showAlert('Emergency contact phone must be in format +923000000000 or 03000000000', 'error');
            return;
        }
        if (editFormData.cnic && !cnicRegex.test(editFormData.cnic)) {
            showAlert('CNIC must be in format 12345-1234567-1', 'error');
            return;
        }

        try {
            await updateUserProfile(selectedUser!, editFormData);

            showAlert('Profile updated successfully!', 'success');
            setIsEditingProfile(false);

            // Refresh details and users list to reflect generic name changes
            await handleUserClick(selectedUser!);
            const usersData = await getAllUsers();
            setUsers(usersData);
        } catch (error) {
            showAlert('Failed to update profile. Check permissions.', 'error');
        }
    };

    if (!isAuthorized) {
        return null;
    }

    // if (loading) {
    //     return (
    //         <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
    //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    //         </div>
    //     );
    // }
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
        <div className="min-h-screen flex flex-col bg-neutral-50 pt-20">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Admin Console</h1>
                        <p className="text-neutral-600">Platform Overview and User Management</p>
                    </div>
                </div>

                {/* Expanded Stats Grid - Always Visible at Top */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <p className="text-sm font-bold text-neutral-500 mb-1 uppercase tracking-wider">Total Patients</p>
                            <h3 className="text-3xl font-black text-neutral-900">{stats.users?.by_role?.user || 0}</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Active: {stats.users?.by_role?.user_active || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                            <p className="text-sm font-bold text-neutral-500 mb-1 uppercase tracking-wider">Psychologists</p>
                            <h3 className="text-3xl font-black text-neutral-900">{stats.users?.by_role?.psychologist || 0}</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Active: {stats.users?.by_role?.psychologist_active || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                            <p className="text-sm font-bold text-neutral-500 mb-1 uppercase tracking-wider">Assessments</p>
                            <h3 className="text-3xl font-black text-neutral-900">{stats.assessments?.total || 0}</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Q: {stats.assessments?.questionnaire} | F: {stats.assessments?.facial_emotion}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                            <p className="text-sm font-bold text-neutral-500 mb-1 uppercase tracking-wider">Admins</p>
                            <h3 className="text-3xl font-black text-neutral-900">{stats.users?.by_role?.admin || 0}</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Active: {stats.users?.by_role?.admin_active || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                            <p className="text-sm font-bold text-neutral-500 mb-1 uppercase tracking-wider">SOS Notifications</p>
                            <h3 className="text-3xl font-black text-red-600">
                                {stats.sos_alerts?.active || 0}
                                <span className="text-neutral-400 text-sm font-normal ml-2">Currently Active</span>
                            </h3>
                            <p className="text-xs text-neutral-400 mt-1 font-medium italic">Monitoring live emergency alerts</p>
                        </div>
                    </div>
                )}

                {/* Top Level Section Navigation */}
                <div className="flex gap-4 mb-8 border-b border-neutral-200">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-2 text-lg font-bold transition-all border-b-2 ${activeTab === 'users' || activeTab === 'psychologists' || activeTab === 'admins' ? 'border-primary-600 text-primary-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                    >
                        User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`pb-4 px-2 text-lg font-bold transition-all border-b-2 ${activeTab === 'questions' ? 'border-primary-600 text-primary-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Questionnaire Management
                    </button>
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`pb-4 px-2 text-lg font-bold transition-all border-b-2 ${activeTab === 'help' ? 'border-primary-600 text-primary-900' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Help Center
                    </button>
                </div>

                {/* Conditionally Render List vs Detailed View */}
                {!selectedUser ? (
                    <>
                        {/* Content Area */}
                        <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-neutral-900">
                                    {activeTab === 'questions' ? 'Clinical Questionnaire Setup' : activeTab === 'help' ? 'User Help Requests' : 'Platform User Directory'}
                                </h2>

                                {activeTab === 'questions' && (
                                    <button
                                        onClick={() => { setEditingQuestion({ question_text: '', weight: 1.0, min_value: 1, max_value: 5, question_order: questions.length + 1, is_active: true }); setIsQuestionModalOpen(true); }}
                                        className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-primary-700 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Add New Question
                                    </button>
                                )}

                                {/* Sub-Tabs for User Management */}
                                {activeTab !== 'questions' && activeTab !== 'help' && (
                                    <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 bg-neutral-100 p-1 rounded-lg w-full sm:w-auto">
                                        <button
                                            onClick={() => setActiveTab('users')}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            Users
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('psychologists')}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'psychologists' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            Psychologists
                                            {users.some(u => u.role === 'psychologist' && u.profiles?.verification_status === 'pending') && (
                                                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('admins')}
                                            className={`flex-1 sm:flex-none px-3 py-1.5 sm:px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'admins' ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            Admins
                                        </button>
                                    </div>
                                )}
                            </div>

                            {activeTab !== 'questions' && activeTab !== 'help' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                                                <th className="p-4 font-medium">Name / Email</th>
                                                <th className="p-4 font-medium">Joined</th>
                                                <th className="p-4 font-medium">Role</th>
                                                <th className="p-4 font-medium">Status</th>
                                                <th className="p-4 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedUsers.map((u) => (
                                                <tr
                                                    key={u.id}
                                                    className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                                                    onClick={() => handleUserClick(u.id)}
                                                >
                                                    <td className="p-4">
                                                        <div className="font-medium text-neutral-900">{u.profiles?.full_name || 'No Name'}</div>
                                                        <div className="text-sm text-neutral-500">{u.email}</div>
                                                    </td>
                                                    <td className="p-4 text-neutral-600">
                                                        {new Date(u.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${u.role === 'super_admin' ? 'bg-indigo-100 text-indigo-700' :
                                                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                                u.role === 'psychologist' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-neutral-100 text-neutral-700'
                                                            }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {!u.is_active ? (
                                                            <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">INACTIVE</span>
                                                        ) : u.role === 'psychologist' ? (
                                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.profiles?.verification_status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                u.profiles?.verification_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                    'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {u.profiles?.verification_status?.toUpperCase() || 'PENDING'}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700">ACTIVE</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            {u.role === 'psychologist' && u.profiles?.verification_status === 'pending' && (
                                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold uppercase mr-2 tracking-wider">Pending Verif.</span>
                                                            )}
                                                            {canEditUser(u) ? (
                                                                <div className="flex gap-2">
                                                                    <select
                                                                        className="text-sm border-neutral-300 rounded-md bg-white p-1"
                                                                        value={u.role || 'user'}
                                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                    >
                                                                        <option value="user">User</option>
                                                                        <option value="psychologist">Psych.</option>
                                                                        <option value="admin">Admin</option>
                                                                        {currentUser?.role === 'super_admin' && (
                                                                            <option value="super_admin">Super Admin</option>
                                                                        )}
                                                                    </select>
                                                                    <button
                                                                        onClick={() => handleToggleActive(u.id, u.is_active)}
                                                                        className={`text-xs px-2 py-1 rounded-md font-medium ${u.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
                                                                    >
                                                                        {u.is_active ? 'Deactivate' : 'Activate'}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-neutral-400 font-medium italic">Restricted</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {displayedUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-neutral-500">No users found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : activeTab === 'questions' ? (
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {questions.map((q) => (
                                            <div key={q.id} className="p-4 bg-white border border-neutral-200 rounded-2xl flex justify-between items-center group hover:border-primary-200 transition-all shadow-sm">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${q.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {q.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Order: {q.question_order}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Range: {q.min_value}-{q.max_value}</span>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Weight: {q.weight}</span>
                                                    </div>
                                                    <p className="text-neutral-900 font-medium leading-relaxed">{q.question_text}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setEditingQuestion(q); setIsQuestionModalOpen(true); }} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button onClick={() => deleteQuestion(q.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                                                <th className="p-4 font-medium">Sender</th>
                                                <th className="p-4 font-medium">Subject</th>
                                                <th className="p-4 font-medium">Date</th>
                                                <th className="p-4 font-medium">Status</th>
                                                <th className="p-4 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contactMessages.map((msg) => (
                                                <tr
                                                    key={msg.id}
                                                    className={`border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer ${msg.status === 'unread' ? 'bg-primary-50/30' : ''}`}
                                                    onClick={() => { setSelectedMessage(msg); setIsMessageModalOpen(true); }}
                                                >
                                                    <td className="p-4">
                                                        <div className="font-bold text-neutral-900">{msg.full_name}</div>
                                                        <div className="text-xs text-neutral-500">{msg.email}</div>
                                                    </td>
                                                    <td className="p-4 font-medium text-neutral-800">
                                                        {msg.subject}
                                                    </td>
                                                    <td className="p-4 text-xs text-neutral-500">
                                                        {new Date(msg.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${msg.status === 'unread' ? 'bg-blue-100 text-blue-700' : msg.status === 'read' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                                            {msg.status?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const newStatus = msg.status === 'read' ? 'unread' : 'read';
                                                                    try {
                                                                        await updateContactStatus(msg.id, newStatus);
                                                                        setContactMessages(contactMessages.map(m => m.id === msg.id ? { ...m, status: newStatus } : m));
                                                                    } catch (err) {
                                                                        showAlert('Failed to update status', 'error');
                                                                    }
                                                                }}
                                                                className="text-xs bg-white border border-neutral-200 px-2 py-1 rounded-md hover:bg-neutral-50 transition-colors"
                                                            >
                                                                Mark {msg.status === 'read' ? 'Unread' : 'Read'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {contactMessages.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-neutral-500 italic">No help requests found in history.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Detailed User View Overlay */
                    <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden mt-6 animate-fade-in-up">
                        <div className="p-6 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleCloseDetails}
                                    className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900">
                                        {selectedUserDetails?.profile?.full_name || 'User Summary'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-neutral-500 capitalize">{selectedUserDetails?.user?.role || 'User'} Profile</span>
                                        {selectedUserDetails?.user?.role === 'psychologist' && selectedUserDetails?.profile?.verification_status && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedUserDetails.profile.verification_status === 'approved' ? 'bg-green-100 text-green-700' : selectedUserDetails.profile.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>Verification {selectedUserDetails.profile.verification_status}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {canEditUser(selectedUserDetails?.user) && (
                                <button
                                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditingProfile
                                        ? 'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }`}
                                >
                                    {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                                </button>
                            )}
                        </div>

                        {detailsLoading ? (
                            <div className="p-12 flex justify-center items-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : selectedUserDetails && (
                            <div className="p-6 md:p-8 space-y-8">

                                {/* Profile Information Section */}
                                {selectedUserDetails.user?.role === 'psychologist' && (
                                    <section>
                                        <div className={`${selectedUserDetails.profile?.verification_status === 'approved' ? 'bg-green-50 border-green-200' : selectedUserDetails.profile?.verification_status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-6 mb-2 mt-4 shadow-sm`}>
                                            <h3 className={`text-lg font-bold mb-4 border-b pb-2 ${selectedUserDetails.profile?.verification_status === 'approved' ? 'text-green-900 border-green-200' : selectedUserDetails.profile?.verification_status === 'rejected' ? 'text-red-900 border-red-200' : 'text-orange-900 border-orange-200'}`}>
                                                Psychologist Credentials ({selectedUserDetails.profile?.verification_status?.toUpperCase() || 'PENDING'})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
                                                <div><span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${selectedUserDetails.profile?.verification_status === 'approved' ? 'text-green-600' : selectedUserDetails.profile?.verification_status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>Qualifications</span><span className="text-neutral-900 font-bold">{selectedUserDetails.profile?.qualifications || 'Not provided'}</span></div>
                                                <div><span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${selectedUserDetails.profile?.verification_status === 'approved' ? 'text-green-600' : selectedUserDetails.profile?.verification_status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>Experience Years</span><span className="text-neutral-900 font-bold">{selectedUserDetails.profile?.experience_years || 'Not provided'}</span></div>
                                                <div><span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${selectedUserDetails.profile?.verification_status === 'approved' ? 'text-green-600' : selectedUserDetails.profile?.verification_status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>License Number</span><span className="text-neutral-900 font-bold">{selectedUserDetails.profile?.license_number || 'Not provided'}</span></div>
                                                <div><span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${selectedUserDetails.profile?.verification_status === 'approved' ? 'text-green-600' : selectedUserDetails.profile?.verification_status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>CNIC Number</span><span className="text-neutral-900 font-bold">{selectedUserDetails.profile?.cnic || 'Not provided'}</span></div>
                                            </div>
                                            
                                            {selectedUserDetails.profile?.verification_status === 'pending' && (
                                                <div className="flex gap-3 mt-4 pt-4 border-t border-orange-200">
                                                    <button onClick={() => handleVerifyPsychologist(selectedUserDetails.user.id, 'approved')} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        Approve Practitioner
                                                    </button>
                                                    <button onClick={() => handleVerifyPsychologist(selectedUserDetails.user.id, 'rejected')} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        Reject Application
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <h3 className="text-lg font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Profile Information</h3>
                                    {isEditingProfile ? (
                                        <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-50 p-6 rounded-xl border border-primary-100">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.full_name || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    value={editFormData.phone || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                    placeholder="03000000000 or +923000000000"
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Date of Birth</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={editFormData.date_of_birth || ''}
                                                        onChange={e => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 modern-date-picker"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">
                                                        📅
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Gender</label>
                                                <select
                                                    value={editFormData.gender || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="male">Male</option>
                                                    <option value="female">Female</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">CNIC Number</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.cnic || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, cnic: e.target.value })}
                                                    placeholder="12345-1234567-1"
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Bio / Notes</label>
                                                <textarea
                                                    value={editFormData.bio || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, bio: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Emergency Contact</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.emergency_contact_name || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, emergency_contact_name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Emergency Phone</label>
                                                <input
                                                    type="tel"
                                                    value={editFormData.emergency_contact_phone || ''}
                                                    onChange={e => setEditFormData({ ...editFormData, emergency_contact_phone: e.target.value })}
                                                    placeholder="03000000000 or +923000000000"
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>

                                            <div className="md:col-span-2 flex justify-end mt-4">
                                                <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-medium">
                                                    Save Changes
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Email ID</span><span className="text-neutral-900">{selectedUserDetails.user?.email}</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Phone Number</span><span className="text-neutral-900">{selectedUserDetails.profile?.phone || 'Not provided'}</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Member Since</span><span className="text-neutral-900">{new Date(selectedUserDetails.user?.created_at).toLocaleDateString()}</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Date of Birth</span><span className="text-neutral-900">{selectedUserDetails.profile?.date_of_birth ? new Date(selectedUserDetails.profile.date_of_birth).toLocaleDateString() : 'Not provided'}</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Age</span><span className="text-neutral-900">{calculateAge(selectedUserDetails.profile?.date_of_birth)} years</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Gender Identity</span><span className="text-neutral-900 capitalize">{selectedUserDetails.profile?.gender || 'Not provided'}</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">CNIC Number</span><span className="text-neutral-900">{selectedUserDetails.profile?.cnic || 'Not provided'}</span></div>
                                            <div><span className="text-sm font-medium text-neutral-400 block mb-1">Emergency Contact</span><span className="text-neutral-900">{selectedUserDetails.profile?.emergency_contact_name || 'None'} <br /> {selectedUserDetails.profile?.emergency_contact_phone || ''}</span></div>
                                            <div className="sm:col-span-2 md:col-span-3">
                                                <span className="text-sm font-medium text-neutral-400 block mb-1">Bio / Internal Notes</span>
                                                <p className="text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-100">{selectedUserDetails.profile?.bio || 'No administrative notes available.'}</p>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Assessment History (Hidden for Psychologists and Admins) */}
                                {(selectedUserDetails.user?.role === 'user' || !selectedUserDetails.user?.role) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <section>
                                            <h3 className="text-lg font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Recent Questionnaires</h3>
                                            <div className="space-y-3">
                                                {selectedUserDetails.recent_questionnaire_logs?.length > 0 ? selectedUserDetails.recent_questionnaire_logs.map((log: any) => (
                                                    <div key={log.id} className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex justify-between items-center">
                                                        <span className="text-indigo-900 font-medium">Score: {log.stress_score}/100</span>
                                                        <span className="text-xs text-indigo-500 font-bold bg-white px-2 py-1 rounded-md shadow-sm">{new Date(log.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                )) : <p className="text-sm text-neutral-400 italic">No questionnaire data available.</p>}
                                            </div>
                                        </section>

                                        <section>
                                            <h3 className="text-lg font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Recent Facial Scans</h3>
                                            <div className="space-y-3">
                                                {selectedUserDetails.recent_facial_logs?.length > 0 ? selectedUserDetails.recent_facial_logs.map((log: any) => (
                                                    <div key={log.id} className="bg-purple-50 border border-purple-100 p-3 rounded-xl flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl capitalize" title={log.detected_emotion}>
                                                                {log.detected_emotion === 'angry' ? '😠' : log.detected_emotion === 'disgust' ? '🤢' : log.detected_emotion === 'fear' ? '😨' : log.detected_emotion === 'happy' ? '😊' : log.detected_emotion === 'sad' ? '😢' : log.detected_emotion === 'surprise' ? '😲' : '😐'}
                                                            </span>
                                                            <span className="text-purple-900 font-medium">Confidence: {log.confidence}%</span>
                                                        </div>
                                                        <span className="text-xs text-purple-500 font-bold bg-white px-2 py-1 rounded-md shadow-sm">{new Date(log.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                )) : <p className="text-sm text-neutral-400 italic">No facial scan data available.</p>}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* Full Stress Analytics Chart for Admin */}
                                {(selectedUserDetails.user?.role === 'user' || !selectedUserDetails.user?.role) && (
                                    <section>
                                        <h3 className="text-lg font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Stress Analytics Trend</h3>
                                        <div className="h-64 sm:h-80 w-full bg-neutral-50 rounded-2xl p-4 border border-neutral-100 shadow-sm">
                                            {trendData ? (
                                                <Line data={trendData} options={lineChartOptions} />
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-neutral-400 italic text-sm">
                                                    No trend data available for this user yet.
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* Active Connections with Full Details */}
                                <section>
                                    <h3 className="text-lg font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">
                                        {selectedUserDetails.user?.role === 'psychologist' ? 'Patient Roster Details' : 'Network & Clinical Connections'}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedUserDetails.connections?.length > 0 ? selectedUserDetails.connections.map((conn: any) => {
                                            const otherUser = conn.user_id === selectedUser ? conn.connected_user : conn.user;
                                            return (
                                                <div key={conn.id} className="flex bg-white border border-neutral-200 p-4 rounded-xl shadow-sm gap-4 items-center">
                                                    <div className={`p-3 rounded-full ${conn.connection_type === 'psychologist' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{conn.connection_type} Link</span>
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${conn.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {conn.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p className="font-bold text-neutral-900">{otherUser?.profiles?.full_name || 'Unknown'}</p>
                                                        <p className="text-xs text-neutral-500">{otherUser?.email}</p>
                                                    </div>
                                                </div>
                                            );
                                        }) : <p className="text-sm text-neutral-400 italic col-span-full">
                                            No linked accounts or clinical connections found for this profile.
                                        </p>}
                                    </div>
                                </section>

                            </div>
                        )}
                    </div>
                )}

                {/* Question Modal */}
                {isQuestionModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-primary-50">
                                <h3 className="text-xl font-bold text-primary-900">{editingQuestion?.id ? 'Edit Question' : 'New Question'}</h3>
                                <button onClick={() => setIsQuestionModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleQuestionSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Question Text</label>
                                        <textarea
                                            required
                                            value={editingQuestion?.question_text || ''}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                                            className="w-full px-4 py-3 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none"
                                            rows={3}
                                            placeholder="Enter the question text..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Min Value</label>
                                        <input
                                            type="number"
                                            value={editingQuestion?.min_value || 1}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, min_value: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Max Value</label>
                                        <input
                                            type="number"
                                            value={editingQuestion?.max_value || 5}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, max_value: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Weight</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editingQuestion?.weight || 1.0}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, weight: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1">Order</label>
                                        <input
                                            type="number"
                                            value={editingQuestion?.question_order || 0}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, question_order: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                                        <input
                                            type="checkbox"
                                            id="is_active_check"
                                            checked={editingQuestion?.is_active ?? true}
                                            onChange={e => setEditingQuestion({ ...editingQuestion, is_active: e.target.checked })}
                                            className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                                        />
                                        <label htmlFor="is_active_check" className="text-sm font-bold text-neutral-700 cursor-pointer">Question is Active</label>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-primary-600 text-white font-bold py-3 rounded-2xl shadow-lg hover:bg-primary-700 transition-all mt-6">
                                    {editingQuestion?.id ? 'Update Question' : 'Create Question'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Message Modal */}
                {isMessageModalOpen && selectedMessage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
                            <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                                <div>
                                    <h3 className="text-2xl font-black text-neutral-900 leading-tight">{selectedMessage.subject}</h3>
                                    <p className="text-sm text-neutral-500 mt-1">From {selectedMessage.full_name} ({selectedMessage.email})</p>
                                </div>
                                <button onClick={() => setIsMessageModalOpen(false)} className="p-3 bg-white hover:bg-neutral-100 rounded-2xl transition-all shadow-sm">
                                    <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100 whitespace-pre-wrap text-neutral-800 leading-relaxed min-h-[150px]">
                                    {selectedMessage.message}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-neutral-400 font-medium">
                                        Received on: {new Date(selectedMessage.created_at).toLocaleString()}
                                    </div>
                                    <div className="flex gap-3">
                                        {selectedMessage.status === 'unread' && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await updateContactStatus(selectedMessage.id, 'read');
                                                        setContactMessages(contactMessages.map(m => m.id === selectedMessage.id ? { ...m, status: 'read' } : m));
                                                        setIsMessageModalOpen(false);
                                                    } catch (err) {
                                                        showAlert('Failed to update status', 'error');
                                                    }
                                                }}
                                                className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-100"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsMessageModalOpen(false)}
                                            className="px-6 py-3 rounded-2xl font-bold border-2 border-neutral-100 hover:bg-neutral-50 transition-all"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

