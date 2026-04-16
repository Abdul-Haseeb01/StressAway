// Family Connections Controller
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FamilyConnectionsService } from './family-connections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('family-connections')
@UseGuards(JwtAuthGuard)
export class FamilyConnectionsController {
    constructor(private svc: FamilyConnectionsService) { }

    // ── Static routes FIRST (before :id parameterised routes) ──────────────

    /** GET /api/family-connections */
    @Get()
    getConnections(@CurrentUser() user: any) {
        return this.svc.getConnections(user.userId);
    }

    /** GET /api/family-connections/count */
    @Get('count')
    count(@CurrentUser() user: any) {
        return this.svc.countApproved(user.userId);
    }

    /** POST /api/family-connections/request */
    @Post('request')
    createRequest(
        @CurrentUser() user: any,
        @Body() body: { connected_user_id: string; family_role?: string },
    ) {
        return this.svc.createRequest(user.userId, body.connected_user_id, body.family_role || 'other');
    }

    // ── Parameterised :id routes AFTER static ones ──────────────────────────

    /** PUT /api/family-connections/:id/approve */
    @Put(':id/approve')
    approve(@Param('id') id: string, @CurrentUser() user: any) {
        return this.svc.approveRequest(id, user.userId);
    }

    /** PUT /api/family-connections/:id/reject */
    @Put(':id/reject')
    reject(@Param('id') id: string, @CurrentUser() user: any) {
        return this.svc.rejectRequest(id, user.userId);
    }

    /** PUT /api/family-connections/:id/toggle-sos */
    @Put(':id/toggle-sos')
    toggleSos(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() body: { value: boolean },
    ) {
        return this.svc.toggleSosContact(id, user.userId, body.value);
    }

    /** DELETE /api/family-connections/:id */
    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.svc.deleteConnection(id, user.userId);
    }

    /** PUT /api/family-connections/:id/toggle-logs */
    @Put(':id/toggle-logs')
    toggleLogs(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() body: { share: boolean },
    ) {
        return this.svc.toggleLogSharing(id, user.userId, body.share);
    }

    /** GET /api/family-connections/:id/shared-logs */
    @Get(':id/shared-logs')
    getSharedLogs(@Param('id') id: string, @CurrentUser() user: any) {
        return this.svc.getSharedLogs(id, user.userId);
    }
}
