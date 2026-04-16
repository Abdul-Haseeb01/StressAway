import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateContactStatusDto {
  @IsEnum(['unread', 'read', 'archived'])
  status: 'unread' | 'read' | 'archived';
}
