import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  // TypeOrmModule.forFeature([User]) le dice: "en este módulo voy a usar
  // el repositorio de User". Esto es lo que hace posible el @InjectRepository(User)
  imports: [TypeOrmModule.forFeature([User])],

  controllers: [UsersController],

  providers: [UsersService], // los services van en providers

  // exports: permite que otros módulos usen UsersService
  // Si no lo exportás, solo lo puede usar este módulo
  exports: [UsersService],
})
export class UsersModule {}
