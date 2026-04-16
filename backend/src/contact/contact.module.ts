import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { SupabaseService } from '../common/supabase.service';

@Module({
  controllers: [ContactController],
  providers: [ContactService, SupabaseService],
  exports: [ContactService],
})
export class ContactModule {}
