import { Module } from '@nestjs/common';
import { FamilyConnectionsController } from './family-connections.controller';
import { FamilyConnectionsService } from './family-connections.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    controllers: [FamilyConnectionsController],
    providers: [FamilyConnectionsService, SupabaseService],
    exports: [FamilyConnectionsService],
})
export class FamilyConnectionsModule { }
