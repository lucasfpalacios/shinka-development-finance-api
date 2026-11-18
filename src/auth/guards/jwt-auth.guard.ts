import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Un Guard es como un portero: decide si el request puede pasar o no
// JwtAuthGuard usa la JwtStrategy para verificar el token
// Si el token no es válido, devuelve automáticamente un error 401
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
