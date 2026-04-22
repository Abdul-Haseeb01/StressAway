// Admin Service
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { UpdateProfileDto } from '../auth/dto/auth.dto';

@Injectable()
export class AdminService {
    constructor(private supabaseService: SupabaseService) { }

    /**
     * Get platform statistics
     */
    async getPlatformStats() {
        // Get total users by role and join profiles for verification status
        const { data: users } = await this.supabaseService
            .getClient()
            .from('users')
            .select(`
                role, 
                is_active,
                profiles(verification_status)
            `);

        const getActiveStatus = (u: any) => u.is_active === true || u.is_active === 1 || String(u.is_active) === 'true';

        const userStats = {
            total: users?.length || 0,
            active: users?.filter(u => getActiveStatus(u)).length || 0,
            by_role: {
                user: users?.filter(u => String(u.role).toLowerCase().trim() === 'user').length || 0,
                user_active: users?.filter(u => String(u.role).toLowerCase().trim() === 'user' && getActiveStatus(u)).length || 0,
                psychologist: users?.filter(u => String(u.role).toLowerCase().trim() === 'psychologist').length || 0,
                psychologist_active: users?.filter(u => 
                    String(u.role).toLowerCase().trim() === 'psychologist' && 
                    getActiveStatus(u) && 
                    (Array.isArray(u.profiles) ? u.profiles[0]?.verification_status === 'approved' : (u.profiles as any)?.verification_status === 'approved')
                ).length || 0,
                admin: users?.filter(u => String(u.role).toLowerCase().trim() === 'admin' || String(u.role).toLowerCase().trim() === 'super_admin').length || 0,
                admin_active: users?.filter(u => (String(u.role).toLowerCase().trim() === 'admin' || String(u.role).toLowerCase().trim() === 'super_admin') && getActiveStatus(u)).length || 0,
            },
        };

        // Get total assessments
        const { data: questionnaireLogs } = await this.supabaseService
            .getClient()
            .from('questionnaire_stress_logs')
            .select('id');

        const { data: facialLogs } = await this.supabaseService
            .getClient()
            .from('facial_stress_logs')
            .select('id');

        // Get total connections
        const { data: connections } = await this.supabaseService
            .getClient()
            .from('connections')
            .select('status');

        const connectionStats = {
            total: connections?.length || 0,
            approved: connections?.filter(c => c.status === 'approved').length || 0,
            pending: connections?.filter(c => c.status === 'pending').length || 0,
        };

        // Get total SOS alerts
        // Fetch SOS from sos_notifications table
        const { data: sosLogs } = await this.supabaseService
            .getClient()
            .from('sos_notifications')
            .select('*');

        const sosAlerts = {
            total: sosLogs?.length || 0,
            active: sosLogs?.filter(l => l.status === 'active' || !l.resolved_at).length || 0,
        };


        return {
            users: userStats,
            assessments: {
                questionnaire: questionnaireLogs?.length || 0,
                facial_emotion: facialLogs?.length || 0,
                total: (questionnaireLogs?.length || 0) + (facialLogs?.length || 0),
            },
            connections: connectionStats,
            sos_alerts: sosAlerts,
        };
    }

    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('users')
            .select(`
        id,
        email,
        role,
        is_active,
        created_at,
        profiles(full_name, phone, verification_status, qualifications, experience_years, license_number)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    private async checkAdminPermissions(targetUserId: string, currentUser: any) {
        if (targetUserId === currentUser.userId) {
            throw new ForbiddenException('You cannot modify your own account from the admin dashboard');
        }

        const targetUser = await this.supabaseService.findOne('users', targetUserId);

        if (currentUser.role === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
            throw new ForbiddenException('Standard admins cannot modify other administrators');
        }

        return targetUser;
    }

    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId: string, role: string, currentUser: any) {
        await this.checkAdminPermissions(userId, currentUser);

        if (currentUser.role === 'admin' && role === 'super_admin') {
            throw new ForbiddenException('Standard administrators cannot grant super_admin privileges');
        }

        const updateData = { role };
        return this.supabaseService.update('users', userId, updateData);
    }

    /**
     * Deactivate user (admin only)
     */
    async deactivateUser(userId: string, currentUser: any) {
        await this.checkAdminPermissions(userId, currentUser);
        const updateData = { is_active: false };
        return this.supabaseService.update('users', userId, updateData);
    }

    /**
     * Activate user (admin only)
     */
    async activateUser(userId: string, currentUser: any) {
        await this.checkAdminPermissions(userId, currentUser);
        const updateData = { is_active: true };
        return this.supabaseService.update('users', userId, updateData);
    }

    /**
     * Get user details with all data (admin only)
     */
    async getUserDetails(userId: string) {
        const user = await this.supabaseService.findOne('users', userId);

        const { data: profile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        const { data: questionnaireLogs } = await this.supabaseService
            .getClient()
            .from('questionnaire_stress_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const { data: facialLogs } = await this.supabaseService
            .getClient()
            .from('facial_stress_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const { data: connectionsData } = await this.supabaseService
            .getClient()
            .from('connections')
            .select(`
                *,
                user:users!connections_user_id_fkey(email, role, profiles(full_name)),
                connected_user:users!connections_connected_user_id_fkey(email, role, profiles(full_name))
            `)
            .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);

        return {
            user,
            profile,
            recent_questionnaire_logs: questionnaireLogs,
            recent_facial_logs: facialLogs,
            connections: connectionsData,
        };
    }

    /**
     * Get all questionnaire questions (admin view)
     */
    async getQuestions() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('questionnaire_questions')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data;
    }

    /**
     * Create a new questionnaire question (admin only)
     */
    async createQuestion(data: any) {
        return this.supabaseService.insert('questionnaire_questions', data);
    }

    /**
     * Update an existing questionnaire question (admin only)
     */
    async updateQuestion(id: string, data: any) {
        const { data: result, error } = await this.supabaseService
            .getClient()
            .from('questionnaire_questions')
            .update(data)
            .eq('id', id)
            .select();

        if (error) throw error;
        return result[0];
    }

    /**
     * Delete a questionnaire question (admin only)
     */
    async deleteQuestion(id: string) {
        const { error } = await this.supabaseService
            .getClient()
            .from('questionnaire_questions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    }

    /**
     * Completely update a user's profile (admin bypass)
     */
    async updateUserProfile(userId: string, updateData: UpdateProfileDto, currentUser: any) {
        // Enforce the admin tier constraints before editing
        await this.checkAdminPermissions(userId, currentUser);

        // Check if the profile exists
        const { data: existingProfile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!existingProfile) {
            throw new NotFoundException('Profile not found for this user');
        }

        // Apply profile update
        const { data, error } = await this.supabaseService
            .getClient()
            .from('profiles')
            .update({ ...updateData, updated_at: new Date() })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
