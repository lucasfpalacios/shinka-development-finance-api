import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { User } from './user.entity';

export type BotPlatform = 'whatsapp' | 'telegram';
export const BOT_PLATFORMS: BotPlatform[] = ['whatsapp', 'telegram'];
const LINK_CODE_TTL_MS = 10 * 60 * 1000;

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
      select: ['id', 'email', 'password', 'name', 'avatar', 'googleId'], // traé estos campos específicos
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

  // Genera un código de 6 dígitos válido por 10 minutos para vincular el bot
  async createLinkCode(userId: string) {
    let code: string;
    // Evitamos que dos usuarios tengan el mismo código activo a la vez
    do {
      code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    } while (await this.findByActiveLinkCode(code));

    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);
    await this.repo.update(userId, {
      linkCode: code,
      linkCodeExpiresAt: expiresAt,
    });
    return { code, expiresAt };
  }

  // Lo llama el bot cuando el usuario le manda el código
  async linkWithCode(platform: BotPlatform, senderId: string, code: string) {
    const user = await this.findByActiveLinkCode(code);
    if (!user) throw new BadRequestException('Código inválido o vencido');

    const field = platform === 'whatsapp' ? 'whatsappNumber' : 'telegramId';
    const owner = await this.repo.findOne({ where: { [field]: senderId } });
    if (owner && owner.id !== user.id) {
      throw new ConflictException(
        'Esa cuenta ya está vinculada a otro usuario',
      );
    }

    await this.repo.update(user.id, {
      [field]: senderId,
      linkCode: null,
      linkCodeExpiresAt: null,
    });
    return this.findById(user.id);
  }

  async unlink(userId: string, platform: BotPlatform) {
    const field = platform === 'whatsapp' ? 'whatsappNumber' : 'telegramId';
    // update() con null pone la columna en NULL
    await this.repo.update(userId, { [field]: null });
    return this.findById(userId);
  }

  private findByActiveLinkCode(code: string) {
    return this.repo.findOne({
      where: { linkCode: code, linkCodeExpiresAt: MoreThan(new Date()) },
    });
  }
}
