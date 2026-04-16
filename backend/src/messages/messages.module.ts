import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    controllers: [MessagesController],
    providers: [MessagesService, SupabaseService],
    exports: [MessagesService],
})
export class MessagesModule { }
