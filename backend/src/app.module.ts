// App Module - Root module
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './common/supabase.service';
import { AuthModule } from './auth/auth.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { FacialEmotionModule } from './facial-emotion/facial-emotion.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ConnectionsModule } from './connections/connections.module';
import { SosModule } from './sos/sos.module';
import { AdminModule } from './admin/admin.module';
import { PsychologistModule } from './psychologist/psychologist.module';
import { MessagesModule } from './messages/messages.module';
import { ContactModule } from './contact/contact.module';
import { FamilyConnectionsModule } from './family-connections/family-connections.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        // Load environment variables
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // Serve uploaded files statically
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads/',
        }),
        AuthModule,
        QuestionnaireModule,
        FacialEmotionModule,
        ChatbotModule,
        ConnectionsModule,
        SosModule,
        AdminModule,
        PsychologistModule,
        MessagesModule,
        FamilyConnectionsModule,
        ContactModule,
    ],
    providers: [SupabaseService],
    exports: [SupabaseService],
})
export class AppModule { }
