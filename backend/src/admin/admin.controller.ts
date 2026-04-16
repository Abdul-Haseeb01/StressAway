// Admin Controller
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../auth/decorators/auth.decorators';
import { UserRole, UpdateProfileDto } from '../auth/dto/auth.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
    constructor(private adminService: AdminService) { }

    /**
     * Get platform statistics
     * GET /api/admin/stats
     */
    @Get('stats')
    async getPlatformStats() {
        return this.adminService.getPlatformStats();
    }

    /**
     * Get all users
     * GET /api/admin/users
     */
    @Get('users')
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }

    /**
     * Get user details
     * GET /api/admin/users/:id
     */
    @Get('users/:id')
    async getUserDetails(@Param('id') id: string) {
        return this.adminService.getUserDetails(id);
    }

    /**
     * Update user role
     * PUT /api/admin/users/:id/role
     */
    @Put('users/:id/role')
    async updateUserRole(
        @Param('id') id: string,
        @Body('role') role: string,
        @CurrentUser() currentUser: any,
    ) {
        return this.adminService.updateUserRole(id, role, currentUser);
    }

    /**
     * Deactivate user
     * PUT /api/admin/users/:id/deactivate
     */
    @Put('users/:id/deactivate')
    async deactivateUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
        return this.adminService.deactivateUser(id, currentUser);
    }

    /**
     * Activate user
     * PUT /api/admin/users/:id/activate
     */
    @Put('users/:id/activate')
    async activateUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
        return this.adminService.activateUser(id, currentUser);
    }

    /**
     * Update user profile
     * PUT /api/admin/users/:id/profile
     */
    @Put('users/:id/profile')
    async updateUserProfile(
        @Param('id') id: string,
        @Body() updateData: UpdateProfileDto,
        @CurrentUser() currentUser: any,
    ) {
        return this.adminService.updateUserProfile(id, updateData, currentUser);
    }

    /**
     * Questionnaire Management
     */
    @Get('questionnaire/questions')
    async getQuestions() {
        return this.adminService.getQuestions();
    }

    @Post('questionnaire/questions')
    async createQuestion(@Body() data: any) {
        return this.adminService.createQuestion(data);
    }

    @Put('questionnaire/questions/:id')
    async updateQuestion(@Param('id') id: string, @Body() data: any) {
        return this.adminService.updateQuestion(id, data);
    }

    @Delete('questionnaire/questions/:id')
    async deleteQuestion(@Param('id') id: string) {
        return this.adminService.deleteQuestion(id);
    }
}
