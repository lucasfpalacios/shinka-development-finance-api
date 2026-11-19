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
    // getOrThrow: si JWT_SECRET no existe la app no arranca
    // (además env.validation.ts exige que tenga al menos 32 caracteres)
    const secret = config.getOrThrow<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Ahora payload tiene tipo JwtPayload, ESLint no se queja
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
