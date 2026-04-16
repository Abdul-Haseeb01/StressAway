// SOS Module
import { Module } from '@nestjs/common';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    controllers: [SosController],
    providers: [SosService, SupabaseService],
    exports: [SosService],
})
export class SosModule { }
