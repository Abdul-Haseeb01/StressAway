import { Module } from '@nestjs/common';
import { PsychologistController } from './psychologist.controller';
import { PsychologistService } from './psychologist.service';
import { SupabaseService } from '../common/supabase.service';

@Module({
    controllers: [PsychologistController],
    providers: [PsychologistService, SupabaseService],
})
export class PsychologistModule { }
