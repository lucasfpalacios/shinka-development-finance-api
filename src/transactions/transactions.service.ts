import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { currentMonth, monthRange } from '../common/dates';
import { omitUndefined } from '../common/omit-undefined';
import {
  CreateTransactionDto,
  ListTransactionsQueryDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { Transaction, TransactionType } from './transactions.entity';

export interface MonthSummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  expensesByCategory: { category: string; total: number }[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Escapa % y _ para que el usuario no pueda meter comodines en el ILIKE
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

// IMPORTANTE: todos los métodos reciben userId y filtran por él,
// así un usuario nunca puede ver ni tocar transacciones de otro.
@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction) private repo: Repository<Transaction>,
  ) {}

  create(userId: string, dto: CreateTransactionDto, source = 'dashboard') {
    const tx = this.repo.create({ ...omitUndefined(dto), userId, source });
    return this.repo.save(tx);
  }

  async findAll(userId: string, q: ListTransactionsQueryDto) {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.userId = :userId', { userId });

    if (q.from) qb.andWhere('t.date >= :from', { from: q.from });
    if (q.to) qb.andWhere('t.date <= :to', { to: q.to });
    if (q.type) qb.andWhere('t.type = :type', { type: q.type });
    if (q.source) qb.andWhere('t.source = :source', { source: q.source });
    if (q.category)
      qb.andWhere('t.category = :category', { category: q.category });
    if (q.search) {
      qb.andWhere('(t.description ILIKE :search OR t.category ILIKE :search)', {
        search: `%${escapeLike(q.search)}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .take(q.limit)
      .skip(q.offset)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(userId: string, id: string) {
    const tx = await this.repo.findOne({ where: { id, userId } });
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    return tx;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const tx = await this.findOne(userId, id);
    Object.assign(tx, omitUndefined(dto));
    return this.repo.save(tx);
  }

  async remove(userId: string, id: string) {
    const tx = await this.findOne(userId, id);
    await this.repo.remove(tx);
  }

  // Totales del mes: ingresos, gastos, balance y gastos por categoría
  async summary(userId: string, month = currentMonth()): Promise<MonthSummary> {
    const [from, to] = monthRange(month);
    const rows = await this.repo
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('t.category', 'category')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date >= :from AND t.date < :to', { from, to })
      .groupBy('t.type')
      .addGroupBy('t.category')
      .getRawMany<{ type: TransactionType; category: string; total: string }>();

    let income = 0;
    let expense = 0;
    const expensesByCategory: MonthSummary['expensesByCategory'] = [];

    for (const row of rows) {
      const total = Number(row.total);
      if (row.type === TransactionType.INCOME) {
        income += total;
      } else {
        expense += total;
        expensesByCategory.push({
          category: row.category,
          total: round2(total),
        });
      }
    }
    expensesByCategory.sort((a, b) => b.total - a.total);

    return {
      month,
      income: round2(income),
      expense: round2(expense),
      balance: round2(income - expense),
      expensesByCategory,
    };
  }
}
