import { Controller, Get } from '@nestjs/common';
import { Client, getMezonClient } from '@n0xgg04/nezon';
import type { MezonClient } from 'mezon-sdk';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Client() private readonly client: MezonClient,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('client-info')
  async getClientInfo() {
    return {
      message: 'MezonClient is available',
      hasClient: !!this.client,
      hasGlobalClient: !!getMezonClient(),
    };
  }

  @Get('client-constructor')
  async getClientFromConstructor(@Client() client: MezonClient) {
    return {
      message: 'MezonClient injected via @Client() decorator',
      hasClient: !!client,
      sameInstance: client === this.client,
    };
  }
}
