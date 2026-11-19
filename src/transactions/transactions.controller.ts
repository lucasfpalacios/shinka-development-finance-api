import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import {
  CreateTransactionDto,
  ListTransactionsQueryDto,
  MonthQueryDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { TransactionsService } from './transactions.service';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private transactions: TransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.transactions.findAll(user.id, query);
  }

  // Tiene que ir ANTES de ':id', si no Nest interpreta "summary" como un id
  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() query: MonthQueryDto) {
    return this.transactions.summary(user.id, query.month);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactions.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactions.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactions.remove(user.id, id);
  }
}
