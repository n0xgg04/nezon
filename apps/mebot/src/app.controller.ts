import { Controller, Get } from '@nestjs/common';
import { getMezonClient } from '@n0xgg04/nezon';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('client-info')
  async getClientInfo() {
    const client = getMezonClient();
    return {
      botId: client.botId,
      isReady: client.isReady(),
    };
  }
}
