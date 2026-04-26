// API Utility - Complete backend integration
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

import { getStoredToken, clearStorage } from './storage';

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            if (typeof window !== 'undefined') {
                clearStorage();

                // Don't alert if we are already on auth pages or home
                if (window.location.pathname !== '/login' &&
                    window.location.pathname !== '/register' &&
                    window.location.pathname !== '/forgot-password' &&
                    window.location.pathname !== '/') {
                    window.dispatchEvent(new CustomEvent('globalAlert', {
                        detail: { message: 'Your session has expired or your permissions were changed by an Administrator. Please log in again.', type: 'error' }
                    }));
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH ====================
export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (userData: {
    full_name: string;
    email: string;
    password: string;
    role: string;
}) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const verifyEmail = async (email: string) => {
    const response = await api.post('/auth/verify-email', { email });
    return response.data;
};

export const resetPassword = async (email: string, currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { email, currentPassword, newPassword });
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/auth/profile');
    return response.data;
};

export const updateProfile = async (data: any) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete('/auth/account');
    return response.data;
};

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/auth/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// ==================== FACIAL EMOTION ====================
export const predictFacialEmotion = async (imageBase64: string) => {
    const response = await api.post('/facial-emotion/predict', { image_base64: imageBase64 });
    return response.data;
};



// ==================== QUESTIONNAIRE ====================
export const getQuestions = async () => {
    const response = await api.get('/questionnaire/questions');
    return response.data;
};

export const submitQuestionnaire = async (responses: { question_id: string; answer_value: number }[], notes?: string) => {
    const response = await api.post('/questionnaire/submit', { responses, notes });
    return response.data;
};

export const getQuestionnaireLogs = async () => {
    const response = await api.get('/questionnaire/logs');
    return response.data;
};

export const getQuestionnaireStats = async () => {
    const response = await api.get('/questionnaire/stats');
    return response.data;
};

// ==================== FACIAL EMOTION ====================
export const getFacialEmotionLogs = async () => {
    const response = await api.get('/facial-emotion/logs');
    return response.data;
};

export const getFacialEmotionStats = async () => {
    const response = await api.get('/facial-emotion/stats');
    return response.data;
};

// ==================== CHATBOT ====================
export const sendChatMessage = async (message: string) => {
    const response = await api.post('/chatbot/send', { message });
    return response.data;
};

export const getChatHistory = async () => {
    const response = await api.get('/chatbot/history');
    return response.data;
};

// ==================== CONNECTIONS ====================
export const createConnectionRequest = async (data: {
    connected_user_id: string;
    connection_type: 'psychologist' | 'family';
}) => {
    const response = await api.post('/connections/request', data);
    return response.data;
};

export const approveConnection = async (id: string) => {
    const response = await api.put(`/connections/${id}/approve`);
    return response.data;
};

export const rejectConnection = async (id: string) => {
    const response = await api.put(`/connections/${id}/reject`);
    return response.data;
};

export const getConnections = async () => {
    const response = await api.get('/connections');
    return response.data;
};

export const deleteConnection = async (id: string) => {
    const response = await api.delete(`/connections/${id}`);
    return response.data;
};

export const searchPsychologists = async () => {
    const response = await api.get('/connections/psychologists');
    return response.data;
};

export const searchUsers = async (query: string) => {
    const response = await api.get(`/connections/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

// ==================== FAMILY CONNECTIONS ====================
export const getFamilyConnections = async () => {
    const response = await api.get('/family-connections');
    return response.data;
};

export const createFamilyRequest = async (connected_user_id: string, family_role: string) => {
    const response = await api.post('/family-connections/request', { connected_user_id, family_role });
    return response.data;
};

export const approveFamilyConnection = async (id: string) => {
    const response = await api.put(`/family-connections/${id}/approve`);
    return response.data;
};

export const rejectFamilyConnection = async (id: string) => {
    const response = await api.put(`/family-connections/${id}/reject`);
    return response.data;
};

export const deleteFamilyConnection = async (id: string) => {
    const response = await api.delete(`/family-connections/${id}`);
    return response.data;
};

export const getFamilyConnectionCount = async () => {
    const response = await api.get('/family-connections/count');
    return response.data;
};

export const toggleFamilySosContact = async (id: string, value: boolean) => {
    const response = await api.put(`/family-connections/${id}/toggle-sos`, { value });
    return response.data;
};

export const toggleFamilyLogSharing = async (id: string, share: boolean) => {
    const response = await api.put(`/family-connections/${id}/toggle-logs`, { share });
    return response.data;
};

export const getFamilySharedLogs = async (id: string) => {
    const response = await api.get(`/family-connections/${id}/shared-logs`);
    return response.data;
};

// ==================== MESSAGES ====================
export const sendMessage = async (connectionId: string, content: string) => {
    const response = await api.post(`/messages/${connectionId}`, { content });
    return response.data;
};

export const getMessages = async (connectionId: string) => {
    const response = await api.get(`/messages/${connectionId}`);
    return response.data;
};

export const getUnreadCounts = async () => {
    const response = await api.get('/messages/unread/counts');
    return response.data;
};

// ==================== SOS ====================
export const triggerSOS = async (message?: string) => {
    const response = await api.post('/sos/trigger', { message });
    return response.data;
};

export const getUnreadSosNotifications = async () => {
    const response = await api.get('/sos/notifications/unread');
    return response.data;
};

export const markSosNotificationRead = async (id: string) => {
    const response = await api.put(`/sos/notifications/${id}/read`);
    return response.data;
};

export const getReceivedSosAlerts = async () => {
    const response = await api.get('/sos/received');
    return response.data;
};

// ==================== SOS CONTACTS ====================
export const getSosContacts = async () => {
    const response = await api.get('/sos/contacts');
    return response.data;
};

export const sendSosRequest = async (targetUserId: string) => {
    const response = await api.post('/sos/contacts/request', { targetUserId });
    return response.data;
};

export const approveSosContact = async (id: string) => {
    const response = await api.put(`/sos/contacts/${id}/approve`);
    return response.data;
};

export const rejectSosContact = async (id: string) => {
    const response = await api.put(`/sos/contacts/${id}/reject`);
    return response.data;
};

export const removeSosContact = async (id: string) => {
    const response = await api.delete(`/sos/contacts/${id}`);
    return response.data;
};

export const getSOSAlerts = async () => {
    const response = await api.get('/sos/alerts');
    return response.data;
};

export const acknowledgeSOSAlert = async (id: string) => {
    const response = await api.put(`/sos/${id}/acknowledge`);
    return response.data;
};

export const resolveSOSAlert = async (id: string) => {
    const response = await api.put(`/sos/${id}/resolve`);
    return response.data;
};

export const getActiveSOSAlerts = async () => {
    const response = await api.get('/sos/active');
    return response.data;
};

// ==================== ADMIN ====================
export const getAdminStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const getUserDetails = async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
};

export const updateUserRole = async (id: string, role: string) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
};

export const deactivateUser = async (id: string) => {
    const response = await api.put(`/admin/users/${id}/deactivate`);
    return response.data;
};

export const activateUser = async (id: string) => {
    const response = await api.put(`/admin/users/${id}/activate`);
    return response.data;
};

export const updateUserProfile = async (id: string, profileData: any) => {
    const response = await api.put(`/admin/users/${id}/profile`, profileData);
    return response.data;
};

// ==================== PSYCHOLOGIST ====================
export const getPatientDetails = async (id: string) => {
    const response = await api.get(`/psychologist/patients/${id}`);
    return response.data;
};

// ==================== HELP CENTER / CONTACT ====================
export const sendContactMessage = async (data: {
    fullName: string;
    email: string;
    subject: string;
    message: string;
}) => {
    const response = await api.post('/contact', data);
    return response.data;
};

export const getContactMessages = async () => {
    const response = await api.get('/contact');
    return response.data;
};

export const updateContactStatus = async (id: string, status: string) => {
    const response = await api.put(`/contact/${id}/status`, { status });
    return response.data;
};

export default api;

