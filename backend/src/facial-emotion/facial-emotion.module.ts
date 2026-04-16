// Facial Emotion Module
import { Module } from '@nestjs/common';
import { FacialEmotionController } from './facial-emotion.controller';
import { FacialEmotionService } from './facial-emotion.service';
import { SupabaseService } from '../common/supabase.service';
import { SosModule } from '../sos/sos.module';

@Module({
    imports: [SosModule],
    controllers: [FacialEmotionController],
    providers: [FacialEmotionService, SupabaseService],
    exports: [FacialEmotionService],
})
export class FacialEmotionModule { }
