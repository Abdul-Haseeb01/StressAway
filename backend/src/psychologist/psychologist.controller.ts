import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { PsychologistService } from './psychologist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators/auth.decorators';
import { UserRole } from '../auth/dto/auth.dto';

@Controller('psychologist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PSYCHOLOGIST)
export class PsychologistController {
    constructor(private readonly psychologistService: PsychologistService) { }

    /**
     * Get detailed information for a specific connected patient
     * GET /api/psychologist/patients/:id
     */
    @Get('patients/:id')
    async getPatientDetails(
        @Param('id') patientId: string,
        @CurrentUser() user: any,
    ) {
        return this.psychologistService.getPatientDetails(patientId, user.userId);
    }
}
