import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { decimalTransformer } from '../common/decimal.transformer';

// Un solo presupuesto por usuario + categoría + mes
@Unique(['userId', 'category', 'month'])
@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string; // para qué categoría es el presupuesto (ej: 'comida')

  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  limit: number; // cuánto podés gastar en esa categoría

  // Formato '2024-01' para identificar el mes
  // Así podés tener presupuestos distintos para cada mes
  @Column()
  month: string;

  @ManyToOne(() => User, (u) => u.budgets, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
