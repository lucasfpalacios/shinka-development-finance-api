import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    // registerAsync: espera a que ConfigModule cargue el .env
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Duración del token, ej: '7d'. Se convierte a segundos.
          expiresIn: parseDuration(
            config.get<string>('JWT_EXPIRES_IN') ?? '7d',
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}

// '7d' → 604800, '12h' → 43200, '30m' → 1800, '3600' → 3600
function parseDuration(value: string): number {
  const match = /^(\d+)([smhd]?)$/.exec(value.trim());
  if (!match) throw new Error(`JWT_EXPIRES_IN inválido: ${value}`);
  const unit = { '': 1, s: 1, m: 60, h: 3600, d: 86400 }[match[2]] ?? 1;
  return Number(match[1]) * unit;
}
