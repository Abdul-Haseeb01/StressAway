// Chatbot Controller
import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/chatbot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
    constructor(private chatbotService: ChatbotService) { }

    /**
     * Send message to chatbot
     * POST /api/chatbot/send
     */
    @Post('send')
    async sendMessage(
        @CurrentUser() user: any,
        @Body() sendMessageDto: SendMessageDto,
    ) {
        return this.chatbotService.sendMessage(user.userId, sendMessageDto);
    }

    /**
     * Get chat history
     * GET /api/chatbot/history
     */
    @Get('history')
    async getChatHistory(
        @CurrentUser() user: any,
        @Query('limit') limit?: number,
    ) {
        return this.chatbotService.getChatHistory(user.userId, limit || 50);
    }
}
