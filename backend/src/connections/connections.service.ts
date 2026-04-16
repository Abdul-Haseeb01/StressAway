// Connections Service
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { CreateConnectionDto } from './dto/connections.dto';

@Injectable()
export class ConnectionsService {
    constructor(private supabaseService: SupabaseService) { }

    /**
     * Create connection request
     */
    async createConnection(userId: string, createConnectionDto: CreateConnectionDto) {
        const { connected_user_id, connection_type } = createConnectionDto;

        // Check if user exists
        const connectedUser = await this.supabaseService.findOne('users', connected_user_id);
        if (!connectedUser) {
            throw new NotFoundException('Connected user not found');
        }

        // Check if connection already exists
        const { data: existing } = await this.supabaseService
            .getClient()
            .from('connections')
            .select('*')
            .eq('user_id', userId)
            .eq('connected_user_id', connected_user_id)
            .single();

        if (existing) {
            throw new BadRequestException('Connection already exists');
        }

        // Create connection request
        const connectionData = {
            user_id: userId,
            connected_user_id,
            connection_type,
            status: 'pending',
        };

        const result = await this.supabaseService.insert('connections', connectionData);
        return result[0];
    }

    /**
     * Approve connection request
     */
    async approveConnection(connectionId: string, userId: string) {
        const connection = await this.supabaseService.findOne('connections', connectionId);

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        // Only the connected user can approve
        if (connection.connected_user_id !== userId) {
            throw new BadRequestException('You cannot approve this connection');
        }

        const updateData = {
            status: 'approved',
            responded_at: new Date().toISOString(),
        };

        return this.supabaseService.update('connections', connectionId, updateData);
    }

    /**
     * Reject connection request
     */
    async rejectConnection(connectionId: string, userId: string) {
        const connection = await this.supabaseService.findOne('connections', connectionId);

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        // Only the connected user can reject
        if (connection.connected_user_id !== userId) {
            throw new BadRequestException('You cannot reject this connection');
        }

        const updateData = {
            status: 'rejected',
            responded_at: new Date().toISOString(),
        };

        return this.supabaseService.update('connections', connectionId, updateData);
    }

    /**
     * Get user's connections
     */
    async getUserConnections(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('connections')
            .select(`
        *,
        connected_user:users!connections_connected_user_id_fkey(
          id, 
          email,
          profiles(full_name, phone)
        ),
        requester:users!connections_user_id_fkey(
          id,
          email,
          profiles(full_name)
        )
      `)
            .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Attach is_incoming so the frontend knows direction:
        // is_incoming = true  → this user is the RECEIVER (connected_user_id = userId)
        // is_incoming = false → this user is the SENDER   (user_id = userId)
        return (data || []).map((conn: any) => ({
            ...conn,
            is_incoming: conn.connected_user_id === userId,
        }));
    }

    /**
     * Delete connection
     */
    async deleteConnection(connectionId: string, userId: string) {
        const connection = await this.supabaseService.findOne('connections', connectionId);

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        // Only users involved in the connection can delete it
        if (connection.user_id !== userId && connection.connected_user_id !== userId) {
            throw new BadRequestException('You cannot delete this connection');
        }

        await this.supabaseService.delete('connections', connectionId);

        // Cleanup SOS contacts as well
        const { user_id, connected_user_id } = connection;
        await this.supabaseService.getClient()
            .from('sos_contacts')
            .delete()
            .or(`and(user_id.eq.${user_id},sos_contact_id.eq.${connected_user_id}),and(user_id.eq.${connected_user_id},sos_contact_id.eq.${user_id})`);

        return { success: true };
    }

    /**
     * Search for psychologists
     */
    async searchPsychologists() {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('users')
            .select(`
        id,
        email,
        profiles(full_name, bio, phone)
      `)
            .eq('role', 'psychologist')
            .eq('is_active', true);

        if (error) throw error;
        return data;
    }

    /**
     * Search users by name or email (for family connections)
     */
    async searchUsers(currentUserId: string, query: string) {
        if (!query || query.trim().length < 2) return [];

        const q = `%${query.trim()}%`;

        const { data, error } = await this.supabaseService
            .getClient()
            .from('users')
            .select(`
                id,
                email,
                profiles(full_name)
            `)
            .or(`email.ilike.${q}`)
            .neq('id', currentUserId)
            .eq('is_active', true)
            .eq('role', 'user')   // only regular users, not admin/psychologist
            .limit(10);

        if (error) throw error;

        const lq = query.toLowerCase();
        return (data || [])
            .map((u: any) => ({
                id: u.id,
                email: u.email,
                full_name: u.profiles?.full_name || '',
            }))
            .filter((u: any) =>
                u.email?.toLowerCase().includes(lq) ||
                u.full_name?.toLowerCase().includes(lq)
            );
    }

    /** Toggle is_sos_contact for a psychologist connection */
    async toggleSosContact(id: string, userId: string, value: boolean) {
        const { data: conn } = await this.supabaseService
            .getClient()
            .from('connections')
            .select('user_id, connected_user_id')
            .eq('id', id)
            .single();

        if (!conn) throw new NotFoundException('Connection not found');
        if (conn.user_id !== userId && conn.connected_user_id !== userId) {
            throw new BadRequestException('Not authorised');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('connections')
            .update({ is_sos_contact: value })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
