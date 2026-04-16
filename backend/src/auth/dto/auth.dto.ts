// Authentication DTOs (Data Transfer Objects)
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
    USER = 'user',
    PSYCHOLOGIST = 'psychologist',
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsString()
    @IsOptional()
    full_name?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    full_name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    date_of_birth?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    emergency_contact_name?: string;

    @IsString()
    @IsOptional()
    emergency_contact_phone?: string;
}
