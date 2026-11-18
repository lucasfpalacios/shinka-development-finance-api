import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

// @Injectable() le dice a NestJS que esta clase puede ser "inyectada"
// en otras clases. Es parte del sistema de inyección de dependencias.
// En vez de hacer new UsersService() en cada lugar, NestJS lo crea
// una sola vez y lo comparte donde sea necesario.
@Injectable()
export class UsersService {
  // @InjectRepository(User) le pide a TypeORM el "repositorio" de User
  // Un repositorio es un objeto con métodos para trabajar con la tabla:
  // find, findOne, save, delete, etc.
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  // Busca un usuario por ID
  // findOne({ where: { id } }) es como hacer: SELECT * FROM users WHERE id = ?
  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  // Busca por email e INCLUYE la contraseña (que por defecto está oculta)
  // Necesitamos la contraseña para compararla cuando hace login
  findByEmail(email: string) {
    return this.repo.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name'], // traé estos campos específicos
    });
  }

  findByGoogleId(googleId: string) {
    return this.repo.findOne({ where: { googleId } });
  }

  // Estos dos los usamos en el bot para identificar quién mandó el mensaje
  findByWhatsapp(number: string) {
    return this.repo.findOne({ where: { whatsappNumber: number } });
  }

  findByTelegram(telegramId: string) {
    return this.repo.findOne({ where: { telegramId } });
  }

  // Crea un usuario nuevo
  // this.repo.create() arma el objeto pero NO lo guarda todavía
  // this.repo.save() lo guarda en la base de datos
  async create(data: Partial<User>) {
    const user = this.repo.create(data); // Partial<User> = alguno de los campos de User
    return this.repo.save(user);
  }

  // Actualiza campos de un usuario existente
  // update() hace un UPDATE en la DB, después buscamos el usuario actualizado
  async update(id: string, data: Partial<User>) {
    await this.repo.update(id, data);
    return this.findById(id); // devolvemos el usuario ya actualizado
  }
}
