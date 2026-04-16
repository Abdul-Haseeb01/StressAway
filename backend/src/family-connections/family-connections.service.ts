// Family Connections Service
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';

@Injectable()
export class FamilyConnectionsService {
    constructor(private supabaseService: SupabaseService) { }

    /** Send a family connection request */
    async createRequest(userId: string, connectedUserId: string, familyRole: string) {
        if (userId === connectedUserId) {
            throw new BadRequestException('You cannot connect with yourself');
        }

        // Verify target user exists and is a regular user
        const { data: target, error: tErr } = await this.supabaseService
            .getClient()
            .from('users')
            .select('id, role, is_active')
            .eq('id', connectedUserId)
            .eq('is_active', true)
            .eq('role', 'user')
            .single();

        if (tErr || !target) {
            throw new NotFoundException('User not found');
        }

        // Check duplicate
        const { data: existing } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select('id, status')
            .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${userId})`)
            .maybeSingle();

        if (existing) {
            throw new BadRequestException(
                existing.status === 'approved'
                    ? 'Already connected'
                    : 'Request already exists',
            );
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .insert({
                user_id: userId,
                connected_user_id: connectedUserId,
                family_role: familyRole || 'other',
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /** Get all family connections for the current user, with direction flag */
    async getConnections(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select(`
                *,
                connected_user:users!family_connections_connected_user_id_fkey(
                    id, email,
                    profiles(full_name, avatar_url)
                ),
                requester:users!family_connections_user_id_fkey(
                    id, email,
                    profiles(full_name, avatar_url)
                )
            `)
            .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((conn: any) => ({
            ...conn,
            // is_incoming = true means current user is the RECEIVER
            is_incoming: conn.connected_user_id === userId,
        }));
    }

    /** Approve (only the receiver can approve) */
    async approveRequest(id: string, userId: string) {
        const conn = await this._getAndVerifyReceiver(id, userId);
        if (conn.status !== 'pending') {
            throw new BadRequestException('Request is no longer pending');
        }
        const { data, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .update({ status: 'approved', responded_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /** Reject (only the receiver can reject) */
    async rejectRequest(id: string, userId: string) {
        const conn = await this._getAndVerifyReceiver(id, userId);
        if (conn.status !== 'pending') {
            throw new BadRequestException('Request is no longer pending');
        }
        const { data, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .update({ status: 'rejected', responded_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    /** Delete (either party) */
    async deleteConnection(id: string, userId: string) {
        const { data: conn } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select('user_id, connected_user_id')
            .eq('id', id)
            .single();

        if (!conn) throw new NotFoundException('Connection not found');
        if (conn.user_id !== userId && conn.connected_user_id !== userId) {
            throw new BadRequestException('Not authorised');
        }

        const { error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Cleanup SOS contacts as well
        const { user_id, connected_user_id } = conn;
        await this.supabaseService.getClient()
            .from('sos_contacts')
            .delete()
            .or(`and(user_id.eq.${user_id},sos_contact_id.eq.${connected_user_id}),and(user_id.eq.${connected_user_id},sos_contact_id.eq.${user_id})`);

        return { success: true };
    }

    /** Count by status for stats */
    async countApproved(userId: string) {
        const { count, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select('id', { count: 'exact', head: true })
            .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
            .eq('status', 'approved');
        if (error) throw error;
        return count ?? 0;
    }

    /** Toggle is_sos_contact for a connection */
    async toggleSosContact(id: string, userId: string, value: boolean) {
        const { data: conn } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select('user_id, connected_user_id, status')
            .eq('id', id)
            .single();

        if (!conn) throw new NotFoundException('Connection not found');
        if (conn.user_id !== userId && conn.connected_user_id !== userId) {
            throw new BadRequestException('Not authorised');
        }

        // Only allow SOS toggle if connection is approved
        if (conn.status !== 'approved') {
            throw new BadRequestException('Connection must be approved before adding as SOS contact');
        }

        // 1. Update the family_connections toggle
        const { data, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .update({ is_sos_contact: value })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 2. Sync with 'sos_contacts' table for the notification engine
        // In family view, "adding SOS" means the OTHER person becomes MY emergency contact.
        const otherUserId = conn.user_id === userId ? conn.connected_user_id : conn.user_id;

        if (value === true) {
            // Check if already in sos_contacts
            const { data: existing } = await this.supabaseService.getClient()
                .from('sos_contacts')
                .select('id, status')
                .eq('user_id', userId)
                .eq('sos_contact_id', otherUserId)
                .maybeSingle();

            if (!existing) {
                // We send a request instead of auto-approving (per user's flow requirement)
                await this.supabaseService.getClient()
                    .from('sos_contacts')
                    .insert({
                        user_id: userId,
                        sos_contact_id: otherUserId,
                        status: 'pending' // Family SOS now requires manual approval
                    });
            }
        } else {
            // Remove from sos_contacts
            await this.supabaseService.getClient()
                .from('sos_contacts')
                .delete()
                .eq('user_id', userId)
                .eq('sos_contact_id', otherUserId);
        }

        return data;
    }

    // ── private helpers ────────────────────────────────────────────────────

    private async _getAndVerifyReceiver(id: string, userId: string) {
        const { data: conn } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select('*')
            .eq('id', id)
            .single();

        if (!conn) throw new NotFoundException('Connection not found');
        if (conn.connected_user_id !== userId) {
            throw new BadRequestException('Only the receiver can respond to this request');
        }
        return conn;
    }

    /** Toggle stress log sharing for a family connection */
    async toggleLogSharing(id: string, userId: string, share: boolean) {
        const { data: conn } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select('*')
            .eq('id', id)
            .single();

        if (!conn) throw new NotFoundException('Connection not found');
        
        const isUserSide = conn.user_id === userId;
        const isConnectedSide = conn.connected_user_id === userId;
        
        if (!isUserSide && !isConnectedSide) {
             throw new BadRequestException('Not authorised');
        }

        const updateData: any = {};
        if (isUserSide) {
            updateData.share_logs_to_connected = share;
        } else {
            updateData.share_logs_to_user = share;
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /** Get shared logs of a connected family member */
    async getSharedLogs(id: string, userId: string) {
        const { data: conn } = await this.supabaseService
            .getClient()
            .from('family_connections')
            .select(`
                *,
                user:user_id(id, email, profiles(full_name)),
                connected_user:connected_user_id(id, email, profiles(full_name))
            `)
            .eq('id', id)
            .single();

        if (!conn) throw new NotFoundException('Connection not found');
        if (conn.status !== 'approved') throw new BadRequestException('Connection not approved');

        const isUserSide = conn.user_id === userId;
        const targetUserId = isUserSide ? conn.connected_user_id : conn.user_id;

        // Verify sharing permission
        // If I am user_id, I see logs IF share_logs_to_user is true
        const canView = isUserSide ? conn.share_logs_to_user : conn.share_logs_to_connected;

        if (!canView) {
            throw new BadRequestException('The sender has not authorized sharing their logs with you.');
        }

        // Fetch logs
        const { data: qLogs } = await this.supabaseService
            .getClient()
            .from('questionnaire_stress_logs')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(30);

        const { data: fLogs } = await this.supabaseService
            .getClient()
            .from('facial_stress_logs')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(30);

        return {
            user: isUserSide ? conn.connected_user : conn.user,
            questionnaire_logs: qLogs || [],
            facial_logs: fLogs || [],
        };
    }
}
