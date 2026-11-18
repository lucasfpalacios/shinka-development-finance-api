import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne, // Relación inversa: muchas transacciones pertenecen a UN usuario
} from 'typeorm';
import { User } from '../users/user.entity';

// Enum: define los únicos valores posibles para el tipo de transacción
// Así evitás que alguien mande "gasto" en vez de "expense" y se rompa todo
export enum TransactionType {
  INCOME = 'income', // ingreso
  EXPENSE = 'expense', // gasto
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // type: 'enum' le dice a PostgreSQL que solo acepte los valores del enum
  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType; // 'income' o 'expense'

  // precision: 10 → hasta 10 dígitos en total
  // scale: 2 → 2 decimales (ej: 1234567.89)
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  category: string; // 'comida', 'transporte', 'sueldo', etc.

  @Column({ nullable: true })
  description: string; // descripción opcional

  @Column({ nullable: true })
  source: string; // de dónde vino: 'dashboard', 'whatsapp', 'telegram'

  // type: 'date' guarda solo la fecha, sin hora
  // default: CURRENT_DATE → si no mandás fecha, usa hoy
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relación: Muchas transacciones pertenecen a UN usuario
  // Es la relación inversa del OneToMany que definimos en User
  @ManyToOne(() => User, (u) => u.transactions)
  user: User;

  // userId es la "foreign key": guarda solo el ID del usuario
  // TypeORM lo usa internamente para hacer los JOINs
  @Column()
  userId: string;
}
