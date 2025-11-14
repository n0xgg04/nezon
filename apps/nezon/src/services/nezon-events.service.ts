import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonExplorerService } from './nezon-explorer.service';
import { NezonEventDefinition } from '../interfaces/event-definition.interface';
import {
  NezonParamType,
  NezonParameterMetadata,
} from '../interfaces/parameter-metadata.interface';
import {
  DMHelper,
  SmartMessage,
  type SmartMessageLike,
  type NormalizedSmartMessage,
} from '../messaging/smart-message';
import type { ChannelMessageContent } from 'mezon-sdk';

interface BoundEventHandler {
  event: string;
  handler: (...args: any[]) => any;
}

@Injectable()
export class NezonEventsService {
  private readonly logger = new Logger(NezonEventsService.name);
  private handlers: BoundEventHandler[] = [];
  private isInitialized = false;

  constructor(
    private readonly explorer: NezonExplorerService,
    private readonly clientService: NezonClientService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  initialize() {
    if (this.isInitialized) {
      return;
    }
    const definitions = this.explorer.exploreEvents();
    this.bind(definitions);
    this.isInitialized = true;
  }

  dispose() {
    for (const bound of this.handlers) {
      this.eventEmitter.off(bound.event, bound.handler);
    }
    this.handlers = [];
    this.isInitialized = false;
  }

  private bind(definitions: NezonEventDefinition[]) {
    for (const definition of definitions) {
      const boundHandler = (...args: any[]) => {
        try {
          const result = this.executeEvent(definition, args);
          if (result && typeof (result as Promise<any>).then === 'function') {
            (result as Promise<any>).catch((error: any) =>
              this.logger.error('event handler failed', error?.stack),
            );
          }
        } catch (error) {
          const err = error as Error;
          this.logger.error('event handler failed', err?.stack);
        }
      };
      if (definition.once) {
        this.eventEmitter.once(definition.event, boundHandler);
      } else {
        this.eventEmitter.on(definition.event, boundHandler);
      }
      this.handlers.push({
        event: definition.event,
        handler: boundHandler,
      });
    }
  }

  private executeEvent(definition: NezonEventDefinition, args: any[]) {
    const method = definition.instance[definition.methodName];
    if (typeof method !== 'function') {
      return;
    }
    const parameters = definition.parameters ?? [];
    if (!parameters.length) {
      return method.apply(definition.instance, args);
    }
    const resolvedArgs = this.resolveEventArguments(parameters, args);
    return method.apply(definition.instance, resolvedArgs);
  }

  private resolveEventArguments(
    parameters: NezonParameterMetadata[],
    args: any[],
  ) {
    const size =
      Math.max(
        ...parameters.map((param) => param.index),
        -1,
      ) + 1;
    const resolved = new Array(size).fill(undefined);
    for (const param of parameters) {
      let value: any = undefined;
      switch (param.type) {
        case NezonParamType.CONTEXT:
          value = args;
          break;
        case NezonParamType.MESSAGE: {
          const message = args[0];
          if (typeof param.data === 'string' && param.data && message) {
            value = (message as any)?.[param.data];
          } else {
            value = message;
          }
          break;
        }
        case NezonParamType.CLIENT:
          value = this.clientService.getClient();
          break;
        case NezonParamType.ARGS:
          value = args;
          break;
        case NezonParamType.ARG:
          value =
            typeof param.data === 'number' ? args[param.data] ?? undefined : undefined;
          break;
        case NezonParamType.ATTACHMENTS: {
          const attachments = Array.isArray((args[0] as any)?.attachments)
            ? (args[0] as any).attachments
            : [];
          value =
            typeof param.data === 'number' ? attachments[param.data] : attachments;
          break;
        }
        case NezonParamType.MENTIONS: {
          const mentions = Array.isArray((args[0] as any)?.mentions)
            ? (args[0] as any).mentions
            : [];
          value =
            typeof param.data === 'number' ? mentions[param.data] : mentions;
          break;
        }
        case NezonParamType.EVENT_PAYLOAD:
          value = args[0];
          break;
        case NezonParamType.AUTO_CONTEXT: {
          const client = this.clientService.getClient();
          const helpers = {
            normalize: (input: any) => this.normalizeSmartMessage(input),
          };
          const dmHelper = new DMHelper(client, helpers);
          if (typeof param.data === 'string' && param.data) {
            if (param.data === 'dm') {
              value = dmHelper;
            } else if (param.data === 'message') {
              value = null;
            } else {
              value = [null, dmHelper];
            }
          } else {
            value = [null, dmHelper];
          }
          break;
        }
        default:
          value = undefined;
      }
      resolved[param.index] = value;
    }
    return resolved;
  }

  private normalizeSmartMessage(
    input: SmartMessageLike,
  ): NormalizedSmartMessage {
    if (input instanceof SmartMessage) {
      return input.toJSON();
    }
    if (typeof input === 'string') {
      return { content: { t: input } };
    }
    if (
      input &&
      typeof input === 'object' &&
      'content' in input &&
      typeof (input as NormalizedSmartMessage).content === 'object'
    ) {
      const normalized = input as NormalizedSmartMessage;
      return {
        content: { ...normalized.content },
        attachments: normalized.attachments?.map((attachment) => ({
          ...attachment,
        })),
      };
    }
    if (input && typeof input === 'object') {
      return { content: input as ChannelMessageContent };
    }
    return { content: { t: String(input ?? '') } };
  }
}

