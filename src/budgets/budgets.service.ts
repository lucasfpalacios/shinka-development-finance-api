import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { currentMonth } from '../common/dates';
import { isUniqueViolation } from '../common/db-errors';
import { TransactionsService } from '../transactions/transactions.service';
import { Budget } from './budget.entity';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private repo: Repository<Budget>,
    private transactions: TransactionsService,
  ) {}

  // Presupuestos del mes, con cuánto se gastó en cada categoría
  async findByMonth(userId: string, month = currentMonth()) {
    const [budgets, summary] = await Promise.all([
      this.repo.find({ where: { userId, month }, order: { category: 'ASC' } }),
      this.transactions.summary(userId, month),
    ]);
    const spentByCategory = new Map(
      summary.expensesByCategory.map((c) => [c.category, c.total]),
    );
    return budgets.map((b) => {
      const spent = spentByCategory.get(b.category) ?? 0;
      return {
        ...b,
        spent,
        remaining: Math.round((b.limit - spent) * 100) / 100,
      };
    });
  }

  async create(userId: string, dto: CreateBudgetDto) {
    try {
      return await this.repo.save(this.repo.create({ ...dto, userId }));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          'Ya existe un presupuesto para esa categoría en ese mes',
        );
      }
      throw err;
    }
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.findOne(userId, id);
    budget.limit = dto.limit;
    return this.repo.save(budget);
  }

  async remove(userId: string, id: string) {
    const budget = await this.findOne(userId, id);
    await this.repo.remove(budget);
  }

  private async findOne(userId: string, id: string) {
    const budget = await this.repo.findOne({ where: { id, userId } });
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');
    return budget;
  }
}
