// SOS DTOs
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class TriggerSosDto {
    @IsString()
    @IsOptional()
    trigger_reason?: string;

    @IsNumber()
    @IsOptional()
    stress_level?: number;

    @IsString()
    @IsOptional()
    message?: string;
}
