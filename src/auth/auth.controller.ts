import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import express from 'express';
import { AuthService, AuthResult } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

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
  // Los DTOs validan el body (email válido, contraseña de 8+ caracteres, etc.)
  signup(@Body() body: SignupDto): Promise<AuthResult> {
    return this.auth.signup(body.name, body.email, body.password);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto): Promise<AuthResult> {
    return this.auth.login(body.email, body.password);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirige a Google automáticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: GoogleAuthRequest,
    @Res() res: express.Response,
  ) {
    const result = await this.auth.googleLogin(req.user);
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    // El token va en el "#" (fragment): el navegador nunca lo manda a ningún
    // servidor, así no queda guardado en logs ni en el header Referer.
    res.redirect(`${frontendUrl}/auth/callback#token=${result.access_token}`);
  }
}
