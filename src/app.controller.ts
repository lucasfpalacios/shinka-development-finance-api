import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Health check: sirve para saber si la API está viva
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
