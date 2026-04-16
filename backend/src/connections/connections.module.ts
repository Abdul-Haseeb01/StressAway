// Connections Module
import { Module } from '@nestjs/common';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    controllers: [ConnectionsController],
    providers: [ConnectionsService, SupabaseService],
    exports: [ConnectionsService],
})
export class ConnectionsModule { }
