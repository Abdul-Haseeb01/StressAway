import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { CreateContactMessageDto, UpdateContactStatusDto } from './contact.dto';

@Injectable()
export class ContactService {
  private readonly table = 'contact_messages';

  constructor(private readonly supabaseService: SupabaseService) {}

  async createMessage(createDto: CreateContactMessageDto) {
    const data = {
      full_name: createDto.fullName,
      email: createDto.email,
      subject: createDto.subject,
      message: createDto.message,
      status: 'unread',
    };
    return this.supabaseService.insert(this.table, data);
  }

  async getAllMessages() {
    return this.supabaseService.find(this.table);
  }

  async getMessageById(id: string) {
    return this.supabaseService.findOne(this.table, id);
  }

  async updateStatus(id: string, updateDto: UpdateContactStatusDto) {
    return this.supabaseService.update(this.table, id, { status: updateDto.status });
  }

  async deleteMessage(id: string) {
    return this.supabaseService.delete(this.table, id);
  }
}
