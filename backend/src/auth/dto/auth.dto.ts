// Authentication DTOs (Data Transfer Objects)
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNotEmpty, IsInt } from 'class-validator';

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
    @MinLength(8)
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
    emergency_contact_phone?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    emergency_contact_name?: string;

    @IsString()
    @IsOptional()
    qualifications?: string;

    @IsInt({ message: 'Years of experience must be a valid number' })
    @IsOptional()
    experience_years?: number;

    @IsString()
    @IsOptional()
    license_number?: string;

    @IsString()
    @IsOptional()
    verification_status?: string;

    @IsString()
    @IsOptional()
    avatar_url?: string;
}
