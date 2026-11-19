import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

// Tipo para el usuario que viene de Google (lo definimos en google.strategy.ts)
interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar: string | undefined;
}

// Tipo para lo que devuelve generateToken
export interface AuthResult {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | undefined;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async signup(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const exists = await this.users.findByEmail(email);
    if (exists) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.users.create({ name, email, password: hashed });
    return this.generateToken(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);

    if (!user?.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.generateToken(user);
  }

  async googleLogin(googleUser: GoogleUser): Promise<AuthResult> {
    // Sin email no podemos identificar ni vincular la cuenta
    if (!googleUser.email) {
      throw new UnauthorizedException('Google no devolvió un email');
    }

    let user = await this.users.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.users.findByEmail(googleUser.email);
      if (user) {
        user = await this.users.update(user.id, {
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
        });
      } else {
        user = await this.users.create(googleUser);
      }
    }

    // user nunca puede ser null acá, pero TypeScript no lo sabe
    if (!user) throw new UnauthorizedException('Error al autenticar');

    return this.generateToken(user);
  }

  generateToken(user: User): AuthResult {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    };
  }
}
