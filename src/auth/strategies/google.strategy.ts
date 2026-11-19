import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar: string | undefined;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      // Si no está configurado usamos un placeholder para que la app arranque igual;
      // GoogleAuthGuard bloquea el login con Google en ese caso.
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    return {
      googleId: profile.id,
      email: profile.emails?.[0]?.value?.toLowerCase() ?? '',
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
    };
  }
}
