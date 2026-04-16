// Chatbot Module
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    imports: [ConfigModule],
    controllers: [ChatbotController],
    providers: [ChatbotService, SupabaseService],
    exports: [ChatbotService],
})
export class ChatbotModule { }
