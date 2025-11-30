import { Inject, Injectable } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk';
import { NEZON_MODULE_OPTIONS } from '../nezon-configurable';
import { NezonModuleOptions } from '../nezon.module-interface';
import { setClientService } from './get-mezon-client';

@Injectable()
export class NezonClientService {
  private client: MezonClient | null = null;
  private isLoggedIn = false;

  constructor(
    @Inject(NEZON_MODULE_OPTIONS)
    private readonly options: NezonModuleOptions,
  ) {
    setClientService(this);
  }

  getClient(): MezonClient {
    if (!this.client) {
      this.client = new MezonClient(this.options);
    }
    return this.client;
  }

  async login() {
    if (this.isLoggedIn) {
      return;
    }
    const client = this.getClient();
    await client.login();
    this.isLoggedIn = true;
  }

  async disconnect() {
    if (!this.client) {
      return;
    }
    this.client.closeSocket();
    this.client.removeAllListeners();
    this.client = null;
    this.isLoggedIn = false;
  }
}
