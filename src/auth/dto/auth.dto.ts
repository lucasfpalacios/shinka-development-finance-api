import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SignupDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  // bcrypt solo usa los primeros 72 bytes, por eso el máximo
  @IsString()
  @Length(8, 72, {
    message: 'La contraseña debe tener entre 8 y 72 caracteres',
  })
  password: string;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @Length(1, 72)
  password: string;
}
