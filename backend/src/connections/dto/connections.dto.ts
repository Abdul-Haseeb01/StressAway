// Connections DTOs
import { IsUUID, IsEnum } from 'class-validator';

export enum ConnectionType {
    FAMILY = 'family',
    PSYCHOLOGIST = 'psychologist',
}

export class CreateConnectionDto {
    @IsUUID()
    connected_user_id: string;

    @IsEnum(ConnectionType)
    connection_type: ConnectionType;
}
