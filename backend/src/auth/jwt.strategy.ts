// JWT Strategy for Passport
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private supabaseService: SupabaseService,
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'stressaway-default-secret-key-change-in-production',
        });
    }

    async validate(payload: any) {
        // Payload contains: { sub: userId, email, role }
        const user = await this.supabaseService.findOne('users', payload.sub);

        if (!user || !user.is_active) {
            throw new UnauthorizedException('User not found or inactive');
        }

        // If the user's role has been changed by an admin, invalidate the old JWT token
        if (user.role !== payload.role) {
            throw new UnauthorizedException('Session expired due to role changes. Please re-authenticate.');
        }

        return {
            userId: payload.sub,
            email: payload.email,
            role: user.role,
        };
    }
}
