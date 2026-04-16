// Questionnaire Module
import { Module } from '@nestjs/common';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireService } from './questionnaire.service';
import { SupabaseService } from '../common/supabase.service';
import { SosModule } from '../sos/sos.module';

@Module({
    imports: [SosModule],
    controllers: [QuestionnaireController],
    providers: [QuestionnaireService, SupabaseService],
    exports: [QuestionnaireService],
})
export class QuestionnaireModule { }
