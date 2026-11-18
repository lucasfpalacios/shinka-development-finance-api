import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Definimos el tipo del payload para que TypeScript no se queje
interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    // config.get<string>('JWT_SECRET') le dice a TypeScript que SIEMPRE es string
    // El ?? '' es un fallback por si no existe (nunca debería pasar si el .env está bien)
    const secret = config.get<string>('JWT_SECRET') ?? '';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  // Ahora payload tiene tipo JwtPayload, ESLint no se queja
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
