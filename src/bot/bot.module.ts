import { Module } from '@nestjs/common';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotApiKeyGuard } from './guards/bot-api-key.guard';

@Module({
  imports: [UsersModule, TransactionsModule],
  controllers: [BotController],
  providers: [BotService, BotApiKeyGuard],
})
export class BotModule {}
