import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Config compartida entre main.ts y los tests e2e
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const frontendUrl =
    config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  app.enableCors({
    origin: [
      frontendUrl,
      'capacitor://localhost', // app iOS (Capacitor)
      'https://localhost', // app Android (Capacitor)
    ],
  });

  // Valida todos los body/query contra sus DTOs:
  // whitelist → descarta campos que no están en el DTO
  // forbidNonWhitelisted → y además responde 400 si mandan campos de más
  // transform → convierte query params ("50") al tipo del DTO (50)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
