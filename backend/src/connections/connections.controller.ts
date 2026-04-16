// Connections Controller
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CreateConnectionDto } from './dto/connections.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
    constructor(private connectionsService: ConnectionsService) { }

    // ── Static routes FIRST ─────────────────────────────────────────────────

    /** GET /api/connections */
    @Get()
    async getUserConnections(@CurrentUser() user: any) {
        return this.connectionsService.getUserConnections(user.userId);
    }

    /** POST /api/connections/request */
    @Post('request')
    async createConnection(
        @CurrentUser() user: any,
        @Body() createConnectionDto: CreateConnectionDto,
    ) {
        return this.connectionsService.createConnection(user.userId, createConnectionDto);
    }

    /** GET /api/connections/psychologists */
    @Get('psychologists')
    async searchPsychologists() {
        return this.connectionsService.searchPsychologists();
    }

    /** GET /api/connections/search?q=query */
    @Get('search')
    async searchUsers(
        @CurrentUser() user: any,
        @Query('q') query: string,
    ) {
        return this.connectionsService.searchUsers(user.userId, query || '');
    }

    // ── Parameterised :id routes AFTER ──────────────────────────────────────

    /** PUT /api/connections/:id/approve */
    @Put(':id/approve')
    async approveConnection(@Param('id') id: string, @CurrentUser() user: any) {
        return this.connectionsService.approveConnection(id, user.userId);
    }

    /** PUT /api/connections/:id/reject */
    @Put(':id/reject')
    async rejectConnection(@Param('id') id: string, @CurrentUser() user: any) {
        return this.connectionsService.rejectConnection(id, user.userId);
    }

    /** PUT /api/connections/:id/toggle-sos */
    @Put(':id/toggle-sos')
    async toggleSosContact(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() body: { value: boolean },
    ) {
        return this.connectionsService.toggleSosContact(id, user.userId, body.value);
    }

    /** DELETE /api/connections/:id */
    @Delete(':id')
    async deleteConnection(@Param('id') id: string, @CurrentUser() user: any) {
        return this.connectionsService.deleteConnection(id, user.userId);
    }
}
