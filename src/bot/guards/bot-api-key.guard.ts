import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

// Protege los endpoints del bot: solo n8n (que conoce BOT_API_KEY) puede llamarlos.
// n8n tiene que mandar el header:  x-api-key: <BOT_API_KEY>
@Injectable()
export class BotApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.header('x-api-key') ?? '';
    const expected = this.config.getOrThrow<string>('BOT_API_KEY');

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    // timingSafeEqual compara en tiempo constante (evita ataques por timing)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('API key inválida');
    }
    return true;
  }
}
