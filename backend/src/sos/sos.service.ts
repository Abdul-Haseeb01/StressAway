// SOS Service - Handles emergency notifications and contact management
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { TriggerSosDto } from './dto/sos.dto';

@Injectable()
export class SosService {
    constructor(private supabaseService: SupabaseService) { }

    /**
     * Trigger SOS — finds all is_sos_contact recipients (family + psychologist),
     * inserts one sos_notifications row per recipient (unread), plus legacy sos_alerts row.
     */
    async triggerSos(userId: string, triggerSosDto: TriggerSosDto) {
        // Resolve sender profile to get full name
        const { data: profile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

        const senderName = profile?.full_name || 'A user';
        let { trigger_reason, stress_level, message } = triggerSosDto as any;

        // If message contains the raw userId, replace it with the human-readable name
        if (message && message.includes(userId)) {
            message = message.replace(new RegExp(userId, 'g'), senderName);
        }

        // Recipient IDs gathered from 'sos_contacts' 
        const { data: contacts } = await this.supabaseService
            .getClient()
            .from('sos_contacts')
            .select('sos_contact_id')
            .eq('user_id', userId)
            .eq('status', 'approved');

        const recipientIds = contacts ? contacts.map(c => c.sos_contact_id) : [];

        // Insert notification per recipient into 'sos_notifications'
        if (recipientIds.length > 0) {
            const notifications = recipientIds.map(rid => ({
                sender_id: userId,
                recipient_id: rid,
                message: message || trigger_reason || `${senderName} requested emergency assistance`,
                is_read: false,
            }));
            await this.supabaseService.getClient().from('sos_notifications').insert(notifications);
        }

        return {
            notified_contacts: recipientIds.length,
            message: `SOS alert dispatched to ${recipientIds.length} contact(s).`,
            sos_triggered: true // Add flag for frontend detection
        };
    }

    /**
     * Get unread SOS notifications for the current user (receiver side)
     * Returns alerts that haven't been read yet.
     */
    async getUnreadNotifications(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('sos_notifications')
            .select(`
                *,
                sender:users!sos_notifications_sender_id_fkey(
                    id, email,
                    profiles(full_name, avatar_url)
                )
            `)
            .eq('recipient_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Mark a notification as read
     */
    async markNotificationRead(notificationId: string, userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('sos_notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId)
            .eq('recipient_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get user's sent SOS notifications (History) - use sos_notifications for full recipient details
     */
    async getUserAlerts(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('sos_notifications')
            .select(`
                *,
                recipient:users!sos_notifications_recipient_id_fkey(
                    id, email,
                    profiles(full_name, avatar_url)
                )
            `)
            .eq('sender_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Get all SOS alerts received by the user (Incoming)
     */
    async getReceivedAlerts(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('sos_notifications')
            .select(`
                *,
                sender:users!sos_notifications_sender_id_fkey(
                    id, email,
                    profiles(full_name, avatar_url)
                )
            `)
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Acknowledge SOS alert
     */
    // async acknowledgeSos(alertId: string, acknowledgedBy: string) {
    //     return this.supabaseService.update('sos_alerts', alertId, {
    //         status: 'acknowledged',
    //         acknowledged_by: acknowledgedBy,
    //         acknowledged_at: new Date().toISOString(),
    //     });
    // }

    /**
     * Resolve SOS alert
     */
    // async resolveSos(alertId: string) {
    //     return this.supabaseService.update('sos_alerts', alertId, {
    //         status: 'resolved',
    //         resolved_at: new Date().toISOString(),
    //     });
    // }

    // ==========================================
    // SOS CONTACTS MANAGEMENT
    // ==========================================

    async requestSosContact(userId: string, targetUserId: string) {
        if (userId === targetUserId) {
            throw new Error('You cannot add yourself as an SOS contact');
        }

        // Check if existing
        const { data: existing } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .select('id, status')
            .eq('user_id', userId)
            .eq('sos_contact_id', targetUserId)
            .maybeSingle();

        if (existing) {
            throw new Error(existing.status === 'approved' ? 'Contact already approved' : 'Request already pending');
        }

        const { data, error } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .insert({ user_id: userId, sos_contact_id: targetUserId, status: 'pending' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getSosContacts(userId: string) {
        // We get both outgoing (where I am user_id) and incoming (where I am sos_contact_id)
        const { data, error } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .select(`
                *,
                user:users!sos_contacts_user_id_fkey(id, email, profiles(full_name, avatar_url)),
                sos_contact:users!sos_contacts_sos_contact_id_fkey(id, email, profiles(full_name, avatar_url))
            `)
            .or(`user_id.eq.${userId},sos_contact_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        // Transform for easier frontend consumption
        return (data || []).map(row => ({
            ...row,
            is_incoming: row.sos_contact_id === userId, // true if someone requested ME to be their SOS
        }));
    }

    async approveSosContact(id: string, userId: string) {
        // Can only approve requests sent TO me
        const { data: match } = await this.supabaseService.getClient()
            .from('sos_contacts').select('status').eq('id', id).eq('sos_contact_id', userId).single();
        if (!match) throw new Error('Not found or unauthorized');

        const { data, error } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .update({ status: 'approved', responded_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // ────── SYNC WITH FAMILY CONNECTIONS ──────
        // If this was a family-related SOS request, ensure the family_connections toggle is ON
        await this.supabaseService.getClient()
            .from('family_connections')
            .update({ is_sos_contact: true })
            .or(`and(user_id.eq.${data.user_id},connected_user_id.eq.${data.sos_contact_id}),and(user_id.eq.${data.sos_contact_id},connected_user_id.eq.${data.user_id})`);

        return data;
    }

    async rejectSosContact(id: string, userId: string) {
        // Wait, instead of rejecting, we can just delete or update status. Let's delete to allow re-request.
        const { error } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .delete()
            .eq('id', id)
            .eq('sos_contact_id', userId);
        if (error) throw error;
        return { success: true };
    }

    async removeSosContact(id: string, userId: string) {
        // Sender removes their existing request/connection OR receiver removes their responsibility
        const { data: match } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .select('id, user_id, sos_contact_id')
            .eq('id', id)
            .or(`user_id.eq.${userId},sos_contact_id.eq.${userId}`)
            .single();

        if (!match) throw new Error('Not found or unauthorized');

        const { error } = await this.supabaseService.getClient()
            .from('sos_contacts')
            .delete()
            .eq('id', id);
        if (error) throw error;

        // ────── SYNC WITH FAMILY CONNECTIONS ──────
        // Ensure the family_connections toggle is OFF
        await this.supabaseService.getClient()
            .from('family_connections')
            .update({ is_sos_contact: false })
            .or(`and(user_id.eq.${match.user_id},connected_user_id.eq.${match.sos_contact_id}),and(user_id.eq.${match.sos_contact_id},connected_user_id.eq.${match.user_id})`);

        return { success: true };
    }
}
