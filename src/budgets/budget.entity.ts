import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string; // para qué categoría es el presupuesto (ej: 'comida')

  @Column('decimal', { precision: 10, scale: 2 })
  limit: number; // cuánto podés gastar en esa categoría

  // Formato '2024-01' para identificar el mes
  // Así podés tener presupuestos distintos para cada mes
  @Column()
  month: string;

  @ManyToOne(() => User, (u) => u.budgets)
  user: User;

  @Column()
  userId: string;
}
