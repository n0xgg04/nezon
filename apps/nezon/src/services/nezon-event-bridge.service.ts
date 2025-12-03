import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChannelMessage, Events, MezonClient, TokenSentEvent } from 'mezon-sdk';
import {
  MessageButtonClicked,
  AddClanUserEvent,
} from 'mezon-sdk/dist/cjs/rtapi/realtime';
import { NezonClientService } from '../client/nezon-client.service';
import { NEZON_MODULE_OPTIONS } from '../nezon-configurable';
import type { NezonModuleOptions } from '../nezon.module-interface';
import { NEZON_MENTION_EVENT } from '../decorators/on.decorator';

type EventHandler = (...args: unknown[]) => void;

@Injectable()
export class NezonEventBridgeService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(NezonEventBridgeService.name);
  private readonly unsubscribers: Array<() => void> = [];

  constructor(
    private readonly clientService: NezonClientService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(NEZON_MODULE_OPTIONS)
    private readonly options: NezonModuleOptions,
  ) {}

  async onApplicationBootstrap() {
    const client = this.clientService.getClient();
    this.bindChannelMessage(client);
    this.bindAddClanUser(client);
    const ignore = new Set<Events>([Events.ChannelMessage, Events.AddClanUser]);
    const events = Array.from(new Set(Object.values(Events)));
    for (const event of events) {
      if (ignore.has(event)) {
        continue;
      }
      this.bindSimpleEvent(client, event as Events);
    }
  }

  onApplicationShutdown() {
    const client = this.clientService.getClient();
    while (this.unsubscribers.length) {
      const dispose = this.unsubscribers.pop();
      try {
        dispose?.();
      } catch (error) {
        const err = error as Error;
        this.logger.warn('failed to remove event listener', err?.stack);
      }
    }
    if (
      typeof (client as unknown as { removeAllListeners: () => void })
        .removeAllListeners === 'function'
    ) {
      // Leave remaining listeners to user code; no need to remove all.
    }
  }

  private bindChannelMessage(client: MezonClient) {
    const handler = (message: ChannelMessage) => {
      const record = message as unknown as Record<string, unknown>;
      const botId = this.options.botId;
      if (botId && (record.sender_id as string | undefined) === botId) {
        return;
      }
      ['attachments', 'mentions', 'references'].forEach((key) => {
        const value = record[key];
        if (!Array.isArray(value)) {
          record[key] = [];
        }
      });
      this.eventEmitter.emit(Events.ChannelMessage, message);
      try {
        if (!botId) {
          return;
        }
        const mentions = Array.isArray((record as any).mentions)
          ? ((record as any).mentions as Array<Record<string, unknown>>)
          : [];
        const hasBotMention = mentions.some((mention) => {
          const userId = mention.user_id as string | undefined;
          return userId === botId;
        });
        if (hasBotMention) {
          this.eventEmitter.emit(NEZON_MENTION_EVENT, message);
        }
      } catch {}
    };
    this.registerListener(client, Events.ChannelMessage, handler);
  }

  private bindAddClanUser(client: MezonClient) {
    if (typeof (client as any).onAddClanUser === 'function') {
      try {
        const result = (client as any).onAddClanUser(
          async (user: AddClanUserEvent) => {
            this.eventEmitter.emit(Events.AddClanUser, user);
          },
        );
        if (result && typeof result.catch === 'function') {
          result.catch((error: any) =>
            this.logger.error(
              'failed to bind add clan user listener',
              error?.stack,
            ),
          );
        }
      } catch (error) {
        this.logger.error(
          'failed to bind add clan user listener',
          (error as Error)?.stack,
        );
      }
      return;
    }
    const handler = (user: AddClanUserEvent) => {
      this.eventEmitter.emit(Events.AddClanUser, user);
    };
    this.registerListener(client, Events.AddClanUser, handler);
  }

  private bindSimpleEvent(client: MezonClient, event: Events) {
    const handler: EventHandler = (payload: unknown) => {
      if (event === Events.TokenSend) {
        this.eventEmitter.emit(event, payload as TokenSentEvent);
        return;
      }
      if (event === Events.MessageButtonClicked) {
        this.eventEmitter.emit(event, payload as MessageButtonClicked);
        return;
      }
      this.eventEmitter.emit(event, payload);
    };
    this.registerListener(client, event, handler);
  }

  private registerListener(
    client: MezonClient,
    event: Events,
    handler: EventHandler,
  ) {
    client.on(event, handler as EventHandler);
    this.unsubscribers.push(() => {
      const candidate = client as unknown as {
        off?: (event: Events, listener: EventHandler) => void;
      };
      if (typeof candidate.off === 'function') {
        candidate.off(event, handler);
      } else {
        client.removeListener(event, handler as EventHandler);
      }
    });
  }
}
