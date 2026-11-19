import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BotService } from './bot.service';
import { BotLinkDto, BotSenderDto, BotTransactionDto } from './dto/bot.dto';
import { BotApiKeyGuard } from './guards/bot-api-key.guard';

// Recibe mensajes de n8n (WhatsApp / Telegram). No usa JWT sino API key.
@UseGuards(BotApiKeyGuard)
@Controller('bot')
export class BotController {
  constructor(private bot: BotService) {}

  @Post('link')
  @HttpCode(200)
  link(@Body() dto: BotLinkDto) {
    return this.bot.link(dto);
  }

  @Post('transactions')
  addTransaction(@Body() dto: BotTransactionDto) {
    return this.bot.addTransaction(dto);
  }

  @Get('summary')
  summary(@Query() query: BotSenderDto) {
    return this.bot.summary(query.platform, query.senderId);
  }
}
