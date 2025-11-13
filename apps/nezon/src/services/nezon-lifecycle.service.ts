import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonCommandService } from './nezon-command.service';
import { NezonEventsService } from './nezon-events.service';
import { NezonComponentService } from './nezon-component.service';

@Injectable()
export class NezonLifecycleService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    private readonly clientService: NezonClientService,
    private readonly commandService: NezonCommandService,
    private readonly eventsService: NezonEventsService,
    private readonly componentService: NezonComponentService,
  ) {}

  async onApplicationBootstrap() {
    await this.clientService.login();
    this.eventsService.initialize();
    await this.commandService.initialize();
    this.componentService.initialize();
  }

  async onApplicationShutdown() {
    this.componentService.dispose();
    this.eventsService.dispose();
    await this.clientService.disconnect();
  }
}

