// Auth Helper Functions
import api from './api';

export const authService = {
    async register(email: string, password: string, role: string = 'user', full_name?: string) {
        const response = await api.post('/auth/register', {
            email,
            password,
            role,
            full_name,
        });
        return response.data;
    },

    async login(email: string, password: string) {
        const response = await api.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    },

    async getProfile() {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    async updateProfile(data: any) {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    },
};
