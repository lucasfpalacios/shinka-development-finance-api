import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { BudgetsModule } from './budgets/budgets.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    // Lee el .env y valida que estén todas las variables necesarias
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        // Carga las entidades registradas con TypeOrmModule.forFeature()
        autoLoadEntities: true,
        // synchronize crea/modifica tablas solo. Puede BORRAR columnas y datos,
        // por eso hay que activarlo explícitamente (DB_SYNC=true) y solo en desarrollo.
        synchronize: config.get<string>('DB_SYNC') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    TransactionsModule,
    BudgetsModule,
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
