import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Lo que JwtStrategy.validate() pone en req.user
export interface AuthUser {
  id: string;
  email: string;
}

// Uso: metodo(@CurrentUser() user: AuthUser)
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return req.user;
  },
);
