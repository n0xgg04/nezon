import { Injectable, Logger } from '@nestjs/common';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonExplorerService } from './nezon-explorer.service';
import { NezonEventDefinition } from '../interfaces/event-definition.interface';
import {
  NezonParamType,
  NezonParameterMetadata,
} from '../interfaces/parameter-metadata.interface';

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
    const client = this.clientService.getClient();
    for (const bound of this.handlers) {
      if (typeof (client as any).off === 'function') {
        (client as any).off(bound.event, bound.handler);
      } else {
        client.removeListener(bound.event, bound.handler);
      }
    }
    this.handlers = [];
    this.isInitialized = false;
  }

  private bind(definitions: NezonEventDefinition[]) {
    const client = this.clientService.getClient();
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
        client.once(definition.event, boundHandler);
      } else {
        client.on(definition.event, boundHandler);
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
        case NezonParamType.EVENT_PAYLOAD:
          value = args[0];
          break;
        default:
          value = undefined;
      }
      resolved[param.index] = value;
    }
    return resolved;
  }
}

