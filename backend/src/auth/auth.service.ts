// Authentication Service
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SupabaseService } from '../common/supabase.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private supabaseService: SupabaseService,
        private jwtService: JwtService,
    ) { }

    /**
     * Register a new user
     */
    async register(registerDto: RegisterDto) {
        const { email, password, role, full_name, phone } = registerDto;

        // Check if user already exists
        const existingUser = await this.supabaseService
            .getClient()
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser.data) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userData = {
            email,
            password_hash,
            role: role || 'user',
            is_active: true,
        };

        const newUser = await this.supabaseService.insert('users', userData);

        // Create profile
        if (newUser && newUser[0]) {
            const profileData = {
                user_id: newUser[0].id,
                full_name: full_name || null,
                phone: phone || null,
                verification_status: role === 'psychologist' ? 'pending' : 'approved',
            };

            await this.supabaseService.insert('profiles', profileData);
        }

        // Generate JWT token
        const token = this.generateToken(newUser[0]);

        return {
            user: {
                id: newUser[0].id,
                email: newUser[0].email,
                role: newUser[0].role,
                full_name: full_name || null,
                verification_status: role === 'psychologist' ? 'pending' : 'approved',
            },
            access_token: token,
        };
    }

    /**
     * Login user
     */
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user by email
        const { data: user, error } = await this.supabaseService
            .getClient()
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT token
        const token = this.generateToken(user);

        // Fetch the user's profile to get the full_name and avatar_url
        const { data: profile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('full_name, avatar_url, verification_status, phone, bio')
            .eq('user_id', user.id)
            .single();

        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: profile?.full_name || null,
                avatar_url: profile?.avatar_url || null,
                phone: profile?.phone || null,
                bio: profile?.bio || null,
                verification_status: profile?.verification_status || 'approved',
            },
            access_token: token,
        };
    }

    /**
     * Get user profile
     */
    async getProfile(userId: string) {
        const { data: user, error: userError } = await this.supabaseService
            .getClient()
            .from('users')
            .select('id, email, role, created_at')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            throw new UnauthorizedException('User not found');
        }

        const { data: profile } = await this.supabaseService
            .getClient()
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        return {
            ...user,
            profile: profile || {},
        };
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const { data: profile, error } = await this.supabaseService
            .getClient()
            .from('profiles')
            .update(updateProfileDto)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update profile');
        }

        return profile;
    }

    /**
     * Update user avatar
     */
    async updateAvatar(userId: string, avatarUrl: string) {
        const { data: profile, error } = await this.supabaseService
            .getClient()
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update avatar');
        }

        return {
            message: 'Avatar updated successfully',
            avatar_url: avatarUrl,
            profile,
        };
    }

    /**
     * Verify email exists
     */
    async verifyEmail(email: string) {
        const { data: user } = await this.supabaseService.getClient()
            .from('users').select('id, email').eq('email', email).single();
            
        if (!user) throw new UnauthorizedException('Email not found.');
        return { message: 'Email verified', success: true };
    }

    /**
     * Handle Direct Reset Password with Current Password Verification
     */
    async resetPassword(email: string, currentPassword: string, newPassword: string) {
        try {
            // Verify if email exists and get password hash
            const { data: user } = await this.supabaseService.getClient()
                .from('users').select('id, email, password_hash').eq('email', email).single();
                
            if (!user) throw new UnauthorizedException('Email not found.');
            
            // Verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isPasswordValid) throw new UnauthorizedException('Current password is incorrect.');
            
            const saltRounds = 10;
            const new_password_hash = await bcrypt.hash(newPassword, saltRounds);
            
            await this.supabaseService.getClient()
                .from('users')
                .update({ password_hash: new_password_hash })
                .eq('id', user.id);
                
            return { message: 'Password reset successful' };
        } catch (error: any) {
            throw new UnauthorizedException(error.message || 'Failed to reset password.');
        }
    }

    /**
     * Generate JWT token
     */
    private generateToken(user: any): string {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }

    /**
     * Delete user account
     */
    async deleteAccount(userId: string) {
        // Since database schema uses ON DELETE CASCADE, 
        // deleting from 'users' will remove 'profiles' and related data.
        const { error } = await this.supabaseService.getClient()
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) {
            throw new Error('Failed to delete user account');
        }

        return { message: 'Account deleted successfully', success: true };
    }
}
