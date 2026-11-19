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
import { MonthQueryDto } from '../transactions/dto/transaction.dto';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private budgets: BudgetsService) {}

  @Get()
  findByMonth(@CurrentUser() user: AuthUser, @Query() query: MonthQueryDto) {
    return this.budgets.findByMonth(user.id, query.month);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBudgetDto) {
    return this.budgets.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgets.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.budgets.remove(user.id, id);
  }
}
