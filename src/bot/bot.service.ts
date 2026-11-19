import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService, type BotPlatform } from '../users/users.service';
import { BotLinkDto, BotTransactionDto } from './dto/bot.dto';

@Injectable()
export class BotService {
  constructor(
    private users: UsersService,
    private transactions: TransactionsService,
  ) {}

  // Vincula el WhatsApp/Telegram con el código que el usuario generó en la app
  link({ platform, senderId, code }: BotLinkDto) {
    return this.users.linkWithCode(platform, senderId, code);
  }

  async addTransaction(dto: BotTransactionDto) {
    const { platform, senderId, ...data } = dto;
    const user = await this.findUser(platform, senderId);
    return this.transactions.create(user.id, data, platform);
  }

  async summary(platform: BotPlatform, senderId: string) {
    const user = await this.findUser(platform, senderId);
    return this.transactions.summary(user.id);
  }

  private async findUser(platform: BotPlatform, senderId: string) {
    const user =
      platform === 'whatsapp'
        ? await this.users.findByWhatsapp(senderId)
        : await this.users.findByTelegram(senderId);
    if (!user) {
      throw new NotFoundException(
        'Cuenta no vinculada. Generá un código en la app y mandáselo al bot.',
      );
    }
    return user;
  }
}
