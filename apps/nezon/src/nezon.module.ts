import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MezonClient } from 'mezon-sdk';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigurableModuleClass } from './nezon-configurable';
import { NezonClientService } from './client/nezon-client.service';
import { NezonExplorerService } from './services/nezon-explorer.service';
import { NezonCommandService } from './services/nezon-command.service';
import { NezonEventsService } from './services/nezon-events.service';
import { NezonLifecycleService } from './services/nezon-lifecycle.service';
import { NezonComponentService } from './services/nezon-component.service';
import { NezonEventBridgeService } from './services/nezon-event-bridge.service';
import { NezonUtilsService } from './services/nezon-utils.service';

@Global()
/**
 * Root module that wires Nezon into a NestJS application.
 * Provides the configured `MezonClient` along with discovery, command, event and component services.
 */
@Module({
  imports: [DiscoveryModule, EventEmitterModule.forRoot()],
  providers: [
    NezonClientService,
    NezonExplorerService,
    NezonCommandService,
    NezonEventsService,
    NezonComponentService,
    NezonEventBridgeService,
    NezonLifecycleService,
    NezonUtilsService,
    {
      provide: MezonClient,
      useFactory: (clientService: NezonClientService) =>
        clientService.getClient(),
      inject: [NezonClientService],
    },
  ],
  exports: [
    NezonClientService,
    NezonCommandService,
    NezonEventsService,
    NezonComponentService,
    NezonEventBridgeService,
    NezonUtilsService,
    MezonClient,
  ],
})
export class NezonModule extends ConfigurableModuleClass {}
