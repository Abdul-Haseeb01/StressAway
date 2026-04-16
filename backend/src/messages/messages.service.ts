import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { SendMessageDto } from './dto/messages.dto';

@Injectable()
export class MessagesService {
    constructor(private supabaseService: SupabaseService) { }

    /**
     * Send a direct message in a connection stream
     */
    async sendMessage(connectionId: string, senderId: string, sendMessageDto: SendMessageDto) {
        // Validate connection exists and is approved
        const connection = await this.supabaseService.findOne('connections', connectionId);

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        if (connection.status !== 'approved') {
            throw new BadRequestException('Connection is not approved for messaging');
        }

        // Verify sender is part of this connection
        if (connection.user_id !== senderId && connection.connected_user_id !== senderId) {
            throw new BadRequestException('You are not authorized to send messages on this connection');
        }

        const receiverId = connection.user_id === senderId ? connection.connected_user_id : connection.user_id;

        const messageData = {
            connection_id: connectionId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: sendMessageDto.content,
        };

        const result = await this.supabaseService.insert('direct_messages', messageData);
        return result[0];
    }

    /**
     * Fetch all messages for a specific connection
     */
    async getMessages(connectionId: string, userId: string) {
        // Validation
        const connection = await this.supabaseService.findOne('connections', connectionId);

        if (!connection) {
            throw new NotFoundException('Connection not found');
        }

        if (connection.user_id !== userId && connection.connected_user_id !== userId) {
            throw new BadRequestException('You are not authorized to view these messages');
        }

        // Fetch messages with sender profile details
        const { data, error } = await this.supabaseService
            .getClient()
            .from('direct_messages')
            .select(`
                *,
                sender:users!direct_messages_sender_id_fkey(
                    id,
                    profiles(full_name, avatar_url)
                )
            `)
            .eq('connection_id', connectionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Messages fetch error:', error);
            throw new BadRequestException('Failed to fetch messages');
        }

        // Mark them as read in the background
        this.supabaseService.getClient()
            .from('direct_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('connection_id', connectionId)
            .eq('receiver_id', userId)
            .is('read_at', null)
            .then(({ error }) => {
                if (error) console.error('Failed to mark messages as read:', error);
            });

        return data;
    }

    /**
     * Get unread message counts per connection
     */
    async getUnreadCounts(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('direct_messages')
            .select('connection_id')
            .eq('receiver_id', userId)
            .is('read_at', null);

        if (error) {
            console.error('Unread counts fetch error:', error);
            throw new BadRequestException('Failed to fetch unread counts');
        }

        const counts: Record<string, number> = {};
        for (const msg of data) {
            counts[msg.connection_id] = (counts[msg.connection_id] || 0) + 1;
        }

        return counts;
    }
}
