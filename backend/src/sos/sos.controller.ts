// SOS Controller
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SosService } from './sos.service';
import { TriggerSosDto } from './dto/sos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('sos')
@UseGuards(JwtAuthGuard)
export class SosController {
    constructor(private sosService: SosService) { }

    // ── Static routes first ─────────────────────────────────────────────────

    /** POST /api/sos/trigger */
    @Post('trigger')
    triggerSos(@CurrentUser() user: any, @Body() dto: TriggerSosDto) {
        return this.sosService.triggerSos(user.userId, dto);
    }

    /** GET /api/sos/alerts — user's own sent alerts */
    @Get('alerts')
    getUserAlerts(@CurrentUser() user: any) {
        return this.sosService.getUserAlerts(user.userId);
    }

    /** GET /api/sos/notifications/unread */
    @Get('notifications/unread')
    getUnread(@CurrentUser() user: any) {
        return this.sosService.getUnreadNotifications(user.userId);
    }

    /** GET /api/sos/received — alerts received by the user */
    @Get('received')
    getReceivedAlerts(@CurrentUser() user: any) {
        return this.sosService.getReceivedAlerts(user.userId);
    }

    /** PUT /api/sos/notifications/:id/read — static prefix "notifications" before :id */
    @Put('notifications/:id/read')
    markRead(@Param('id') id: string, @CurrentUser() user: any) {
        return this.sosService.markNotificationRead(id, user.userId);
    }

    // ── SOS Contacts (Static) ───────────────────────────────────────────────

    /** GET /api/sos/contacts */
    @Get('contacts')
    getSosContacts(@CurrentUser() user: any) {
        return this.sosService.getSosContacts(user.userId);
    }

    /** POST /api/sos/contacts/request */
    @Post('contacts/request')
    requestSosContact(@CurrentUser() user: any, @Body('targetUserId') targetUserId: string) {
        return this.sosService.requestSosContact(user.userId, targetUserId);
    }

    // ── SOS Contacts (:id) ──────────────────────────────────────────────────


    /** PUT /api/sos/contacts/:id/approve */
    @Put('contacts/:id/approve')
    approveSosContact(@Param('id') id: string, @CurrentUser() user: any) {
        return this.sosService.approveSosContact(id, user.userId);
    }

    /** PUT /api/sos/contacts/:id/reject */
    @Put('contacts/:id/reject')
    rejectSosContact(@Param('id') id: string, @CurrentUser() user: any) {
        return this.sosService.rejectSosContact(id, user.userId);
    }

    /** DELETE /api/sos/contacts/:id */
    @Delete('contacts/:id')
    removeSosContact(@Param('id') id: string, @CurrentUser() user: any) {
        return this.sosService.removeSosContact(id, user.userId);
    }
}
