import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';
import { AuthService, AuthResult } from './auth.service';
import { ConfigService } from '@nestjs/config';

// Tipo para el usuario que Passport pone en req.user después del Google callback
interface GoogleAuthRequest extends express.Request {
  user: {
    googleId: string;
    email: string;
    name: string;
    avatar: string | undefined;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  @Post('signup')
  signup(
    @Body() body: { name: string; email: string; password: string },
  ): Promise<AuthResult> {
    return this.auth.signup(body.name, body.email, body.password);
  }

  @Post('login')
  login(
    @Body() body: { email: string; password: string },
  ): Promise<AuthResult> {
    return this.auth.login(body.email, body.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirige a Google automáticamente
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: GoogleAuthRequest,
    @Res() res: express.Response,
  ) {
    const result = await this.auth.googleLogin(req.user);
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }
}
