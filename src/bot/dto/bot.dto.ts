import { IsIn, Matches } from 'class-validator';
import { BOT_PLATFORMS, type BotPlatform } from '../../users/users.service';
import { CreateTransactionDto } from '../../transactions/dto/transaction.dto';

// Quién mandó el mensaje: plataforma + id (número de WhatsApp o id de Telegram)
export class BotSenderDto {
  @IsIn(BOT_PLATFORMS)
  platform: BotPlatform;

  @Matches(/^\d{5,20}$/, { message: 'senderId debe ser numérico' })
  senderId: string;
}

// Mismos campos que una transacción normal + quién la mandó
export class BotTransactionDto extends CreateTransactionDto {
  @IsIn(BOT_PLATFORMS)
  platform: BotPlatform;

  @Matches(/^\d{5,20}$/, { message: 'senderId debe ser numérico' })
  senderId: string;
}

export class BotLinkDto extends BotSenderDto {
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code: string;
}
