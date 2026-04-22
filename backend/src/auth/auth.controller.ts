// Authentication Controller
import { Controller, Post, Get, Put, Delete, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';
import { Public, CurrentUser } from './decorators/auth.decorators';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @Public()
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    /**
     * Verify email exists
     * POST /api/auth/verify-email
     */
    @Public()
    @Post('verify-email')
    async verifyEmail(@Body('email') email: string) {
        if (!email) throw new BadRequestException('Email is required');
        return this.authService.verifyEmail(email);
    }

    /**
     * Reset password directly with current password
     * POST /api/auth/reset-password
     */
    @Public()
    @Post('reset-password')
    async resetPassword(@Body() body: { email: string, currentPassword: string, newPassword: string }) {
        if (!body.email || !body.currentPassword || !body.newPassword) throw new BadRequestException('Email, current password, and new password are required');
        return this.authService.resetPassword(body.email, body.currentPassword, body.newPassword);
    }

    /**
     * Get current user profile
     * GET /api/auth/profile
     */
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@CurrentUser() user: any) {
        return this.authService.getProfile(user.userId);
    }

    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.authService.updateProfile(user.userId, updateProfileDto);
    }

    /**
     * Upload user avatar
     * POST /api/auth/avatar
     */
    @UseGuards(JwtAuthGuard)
    @Post('avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                // Ensure unique filename by using user ID and current timestamp
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                const filename = `${req.user['userId']}-${uniqueSuffix}${ext}`;
                cb(null, filename);
            },
        }),
        fileFilter: (req, file, cb) => {
            // Check file type
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                return cb(new BadRequestException('Only image files are allowed!'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        }
    }))
    async uploadAvatar(
        @CurrentUser() user: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            return { message: 'No file uploaded, avatar unchanged' };
        }

        // Construct public URL
        const avatarUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/${file.filename}`;

        try {
            // Update database
            const result = await this.authService.updateAvatar(user.userId, avatarUrl);
            return result;
        } catch (error) {
            throw new BadRequestException('Failed to update avatar in database');
        }
    }

    /**
     * Delete current user account
     * DELETE /api/auth/account
     */
    @UseGuards(JwtAuthGuard)
    @Delete('account')
    async deleteAccount(@CurrentUser() user: any) {
        return this.authService.deleteAccount(user.userId);
    }
}
