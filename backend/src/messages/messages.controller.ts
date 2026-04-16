import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/messages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private messagesService: MessagesService) { }

    /**
     * Get unread message counts for all connections of the current user
     * GET /api/messages/unread/counts
     */
    @Get('unread/counts')
    async getUnreadCounts(@CurrentUser() user: any) {
        return this.messagesService.getUnreadCounts(user.userId);
    }

    /**
     * Send a new message to a connection
     * POST /api/messages/:connectionId
     */
    @Post(':connectionId')
    async sendMessage(
        @Param('connectionId') connectionId: string,
        @CurrentUser() user: any,
        @Body() sendMessageDto: SendMessageDto,
    ) {
        return this.messagesService.sendMessage(connectionId, user.userId, sendMessageDto);
    }

    /**
     * Get all messages for a connection
     * GET /api/messages/:connectionId
     */
    @Get(':connectionId')
    async getMessages(
        @Param('connectionId') connectionId: string,
        @CurrentUser() user: any,
    ) {
        return this.messagesService.getMessages(connectionId, user.userId);
    }
}
