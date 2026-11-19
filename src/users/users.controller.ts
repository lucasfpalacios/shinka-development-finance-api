import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { omitUndefined } from '../common/omit-undefined';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService, type BotPlatform } from './users.service';

enum PlatformParam {
  whatsapp = 'whatsapp',
  telegram = 'telegram',
}

// Todo lo de /users requiere estar logueado
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const found = await this.users.findById(user.id);
    if (!found) throw new NotFoundException('Usuario no encontrado');
    return found;
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.update(user.id, omitUndefined(dto));
  }

  // Paso 1 para vincular el bot: la app pide un código y se lo muestra al usuario
  @Post('me/link-code')
  createLinkCode(@CurrentUser() user: AuthUser) {
    return this.users.createLinkCode(user.id);
  }

  @Delete('me/link/:platform')
  unlink(
    @CurrentUser() user: AuthUser,
    @Param('platform', new ParseEnumPipe(PlatformParam)) platform: BotPlatform,
  ) {
    return this.users.unlink(user.id, platform);
  }
}
