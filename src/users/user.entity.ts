import {
  Entity, // Marca la clase como una tabla
  PrimaryGeneratedColumn, // Columna ID que se genera sola
  Column, // Una columna normal
  CreateDateColumn, // Columna que guarda la fecha de creación automáticamente
  OneToMany, // Relación: un usuario tiene muchas transacciones
} from 'typeorm';
import { Transaction } from '../transactions/transactions.entity';
import { Budget } from '../budgets/budget.entity';

// @Entity('users') le dice a TypeORM: "creá una tabla llamada 'users'"
@Entity('users')
export class User {
  // ID único. 'uuid' genera algo como "a3f8c2d1-..." en vez de 1, 2, 3...
  // Es más seguro porque no se puede adivinar el ID del próximo usuario
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) // nullable: true = puede estar vacío
  name: string;

  @Column({ unique: true, nullable: true }) // unique = no puede haber dos iguales
  email: string;

  // select: false → cuando hagas una consulta de usuarios,
  // la contraseña NO se incluye en el resultado por defecto (seguridad)
  @Column({ nullable: true, select: false })
  password: string;

  // Para login con Google: guardamos el ID que nos da Google
  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  avatar: string; // URL de la foto de perfil

  // Estos campos son para vincular el usuario con su cuenta de WhatsApp o Telegram
  // Cuando alguien mande un mensaje, buscamos por estos campos
  @Column({ nullable: true, unique: true })
  whatsappNumber: string; // ej: "5491123456789"

  @Column({ nullable: true, unique: true })
  telegramId: string; // ej: "123456789"

  // Código temporal de 6 dígitos para vincular WhatsApp/Telegram.
  // El usuario lo pide desde la app y se lo manda al bot: así probamos
  // que el número es suyo (si no, cualquiera podría "reclamar" el número de otro).
  @Column({ type: 'varchar', length: 6, nullable: true, select: false })
  linkCode: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  linkCodeExpiresAt: Date | null;

  @Column({ default: 'ARS' })
  currency: string; // moneda por defecto

  @CreateDateColumn()
  createdAt: Date; // TypeORM llena esto automáticamente al crear el registro

  // Relación: Un usuario TIENE MUCHAS transacciones
  // () => Transaction es el tipo relacionado
  // (t) => t.user le dice cómo están conectados (por el campo 'user' en Transaction)
  @OneToMany(() => Transaction, (t) => t.user)
  transactions: Transaction[];

  @OneToMany(() => Budget, (b) => b.user)
  budgets: Budget[];
}
