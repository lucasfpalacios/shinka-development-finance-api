import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // 1. ConfigModule: permite leer el archivo .env en toda la app
    // isGlobal: true significa que no tenés que importarlo en cada módulo
    ConfigModule.forRoot({ isGlobal: true }),
    // 2. TypeOrmModule: conecta la app a PostgreSQL
    // forRootAsync significa que espera a que ConfigModule cargue el .env antes de conectar
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres', // tipo de base de datos
        host: config.get('DB_HOST'), // lee DB_HOST del .env
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        // Le dice a TypeORM que busque todos los archivos .entity.ts
        // para saber qué tablas crear en la base de datos
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // synchronize: true → TypeORM crea/modifica las tablas automáticamente
        // según tus entidades. Solo usar en desarrollo, nunca en producción
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
