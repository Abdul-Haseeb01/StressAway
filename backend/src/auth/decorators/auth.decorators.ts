// Decorators for authentication and authorization
import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../dto/auth.dto';

// Public route decorator - skip authentication
export const Public = () => SetMetadata('isPublic', true);

// Roles decorator - require specific roles
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Current user decorator - get current user from request
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
