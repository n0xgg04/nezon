import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'mezon-sdk';
import type { ChannelMessageContent } from 'mezon-sdk/dist/cjs/interfaces/client';
import { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonExplorerService } from './nezon-explorer.service';
import { NezonComponentDefinition } from '../interfaces/component-definition.interface';
import { NezonComponentContext } from '../interfaces/component-context.interface';
import {
  NezonParamType,
  NezonParameterMetadata,
} from '../interfaces/parameter-metadata.interface';
import {
  ManagedMessage,
  DMHelper,
  SmartMessage,
  SmartMessageLike,
  NormalizedSmartMessage,
  getButtonClickRegistry,
} from '../messaging/smart-message';
import { NezonCommandContext } from '../interfaces/command-context.interface';
import type { ButtonClickContext } from '../interfaces/button-click-context.interface';

interface RegisteredComponent {
  definition: NezonComponentDefinition;
  matcher: (payload: MessageButtonClicked) => {
    matched: boolean;
    params: string[];
    namedParams?: Record<string, string>;
    match: RegExpMatchArray | null;
  };
}

interface BoundComponentHandler {
  event: string;
  handler: (...args: unknown[]) => void;
}

@Injectable()
export class NezonComponentService {
  private readonly logger = new Logger(NezonComponentService.name);
  private components: Map<string, RegisteredComponent[]> = new Map();
  private isInitialized = false;
  private handlers: BoundComponentHandler[] = [];
  private readonly cacheKeys = {
    channel: Symbol('nezon:component:channel'),
    message: Symbol('nezon:component:message'),
    autoContext: Symbol('nezon:component:autoContext'),
  };

  constructor(
    private readonly explorer: NezonExplorerService,
    private readonly clientService: NezonClientService,
  ) {}

  initialize() {
    if (this.isInitialized) {
      return;
    }
    const definitions = this.explorer.exploreComponents();
    this.registerComponents(definitions);
    this.bindListeners();
    this.isInitialized = true;
  }

  dispose() {
    const client = this.clientService.getClient();
    for (const bound of this.handlers) {
      const withOff = client as unknown as {
        off?: (event: string, listener: (...args: unknown[]) => void) => void;
      };
      if (typeof withOff.off === 'function') {
        withOff.off(bound.event, bound.handler);
        continue;
      }
      client.removeListener(
        bound.event,
        bound.handler as (...args: any[]) => void,
      );
    }
    this.handlers = [];
    this.components.clear();
    this.isInitialized = false;
  }

  private registerComponents(definitions: NezonComponentDefinition[]) {
    this.components.clear();
    for (const definition of definitions) {
      const event =
        definition.options.event ?? Events.MessageButtonClicked;
      const matcher = this.createMatcher(definition);
      const list = this.components.get(event) ?? [];
      list.push({ definition, matcher });
      this.components.set(event, list);
    }
  }

  private bindListeners() {
    const client = this.clientService.getClient();
    this.handlers = [];
    for (const [event, handlers] of this.components.entries()) {
      if (!handlers.length) {
        continue;
      }
      const boundHandler = (...args: unknown[]) => {
        this.handleEvent(event, args).catch((error) => {
          const err = error as Error;
          this.logger.error('component handler failed', err?.stack);
        });
      };
      client.on(event, boundHandler as (...args: any[]) => void);
      this.handlers.push({ event, handler: boundHandler });
    }
  }

  private async handleEvent(event: string, args: unknown[]) {
    const payloadCandidate = args[0];
    if (!this.isMessageButtonClicked(payloadCandidate)) {
      return;
    }
    const payload = payloadCandidate;
    const buttonId = payload.button_id ?? '';

    const registry = getButtonClickRegistry();
    if (buttonId && registry.hasHandler(buttonId)) {
      const componentContext: NezonComponentContext = {
        payload,
        client: this.clientService.getClient(),
        params: [],
        namedParams: undefined,
        match: null,
        cache: new Map<symbol, unknown>(),
      };
      try {
        const handler = registry.getHandler(buttonId);
        if (handler) {
          const clickContext = await this.createButtonClickContext(componentContext);
          await handler(clickContext);
          return;
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error('onClick handler failed', err?.stack);
        return;
      }
    }

    const registrations = this.components.get(event);
    if (!registrations?.length) {
      return;
    }
    for (const registration of registrations) {
      const { matched, params, namedParams, match } = registration.matcher(payload);
      if (!matched) {
        continue;
      }
      const context: NezonComponentContext = {
        payload,
        client: this.clientService.getClient(),
        params,
        namedParams,
        match,
        cache: new Map<symbol, unknown>(),
      };
      try {
        await this.executeComponent(registration.definition, context);
      } catch (error) {
        const err = error as Error;
        this.logger.error('component handler failed', err?.stack);
      }
    }
  }

  private async executeComponent(
    definition: NezonComponentDefinition,
    context: NezonComponentContext,
  ) {
    const method = definition.instance[definition.methodName];
    if (typeof method !== 'function') {
      return;
    }
    const parameters = definition.parameters ?? [];
    if (!parameters.length) {
      await method.call(definition.instance, context);
      return;
    }
    const args = await this.resolveComponentArguments(parameters, context);
    await method.apply(definition.instance, args);
  }

  private async resolveComponentArguments(
    parameters: NezonParameterMetadata[],
    context: NezonComponentContext,
  ) {
    const size =
      Math.max(
        ...parameters.map((param) => param.index),
        -1,
      ) + 1;
    const args = new Array<unknown>(size).fill(undefined);
    for (const param of parameters) {
      let value: unknown = undefined;
      switch (param.type) {
        case NezonParamType.CONTEXT:
          value = context;
          break;
        case NezonParamType.COMPONENT:
          value = context.payload;
          break;
        case NezonParamType.COMPONENT_PARAMS:
          if (typeof param.data === 'string' && param.data) {
            value = context.namedParams?.[param.data] ?? undefined;
          } else {
            value = context.namedParams ?? context.params;
          }
          break;
        case NezonParamType.COMPONENT_PARAM:
          if (typeof param.data === 'string') {
            value = context.namedParams?.[param.data] ?? undefined;
          } else if (typeof param.data === 'number') {
            value = context.params[param.data] ?? undefined;
          } else {
            value = undefined;
          }
          break;
        case NezonParamType.CLIENT:
          value = context.client;
          break;
        case NezonParamType.ARGS:
          value = context.params;
          break;
        case NezonParamType.ARG:
          value =
            typeof param.data === 'number'
              ? context.params[param.data] ?? undefined
              : undefined;
          break;
        case NezonParamType.ATTACHMENTS: {
          const attachments = Array.isArray((context.payload as any)?.attachments)
            ? (context.payload as any).attachments
            : [];
          value =
            typeof param.data === 'number' ? attachments[param.data] : attachments;
          break;
        }
        case NezonParamType.MENTIONS: {
          const mentions = Array.isArray((context.payload as any)?.mentions)
            ? (context.payload as any).mentions
            : [];
          value =
            typeof param.data === 'number' ? mentions[param.data] : mentions;
          break;
        }
        case NezonParamType.COMPONENT_TARGET:
          value = await this.getTargetMessage(context);
          break;
        case NezonParamType.MESSAGE: {
          const message = context.payload as any;
          if (typeof param.data === 'string' && param.data && message) {
            value = message[param.data];
          } else {
            value = message;
          }
          break;
        }
        case NezonParamType.CHANNEL: {
          const channel = await this.getChannel(context);
          if (typeof param.data === 'string' && param.data && channel) {
            value = (channel as any)?.[param.data];
          } else {
            value = channel;
          }
          break;
        }
        case NezonParamType.USER: {
          const user = await this.getUserFromComponent(context);
          if (typeof param.data === 'string' && param.data && user) {
            value = (user as any)?.[param.data];
          } else {
            value = user;
          }
          break;
        }
        case NezonParamType.AUTO_CONTEXT: {
          const autoContext = await this.getAutoContext(context);
          if (typeof param.data === 'string' && param.data) {
            if (param.data === 'message') {
              value = autoContext[0];
            } else if (param.data === 'dm') {
              value = autoContext[1];
            } else {
              value = autoContext;
            }
          } else {
            value = autoContext;
          }
          break;
        }
        default:
          value = undefined;
      }
      args[param.index] = value;
    }
    return args;
  }

  private async getUserFromComponent(context: NezonComponentContext) {
    return this.getOrSetCache(context, Symbol('nezon:component:user'), async () => {
      if (!context.payload.user_id) {
        return undefined;
      }
      try {
        const channel = await this.getChannel(context);
        const clan = channel?.clan;
        if (clan?.users?.fetch) {
          return (await clan.users.fetch(context.payload.user_id)) as User;
        }
      } catch {
        return undefined;
      }
      return undefined;
    });
  }

  private async getAutoContext(
    context: NezonComponentContext,
  ): Promise<[ManagedMessage, DMHelper]> {
    return this.getOrSetCache(context, this.cacheKeys.autoContext, async () => {
      const commandContext = await this.createCommandContextFromComponent(context);
      const helpers = {
        normalize: (input) => this.normalizeSmartMessage(input),
      };
      return [
        new ManagedMessage(commandContext, helpers),
        new DMHelper(context.client, helpers),
      ];
    });
  }

  private async createButtonClickContext(
    componentContext: NezonComponentContext,
  ): Promise<ButtonClickContext> {
    const [message] = await this.getAutoContext(componentContext);
    const channel = await this.getChannel(componentContext);
    const user = await this.getUserFromComponent(componentContext);
    const clan = channel?.clan;

    return {
      message,
      channel: channel ?? undefined,
      user: user ?? undefined,
      clan: clan ?? undefined,
      client: componentContext.client,
    };
  }

  private async createCommandContextFromComponent(
    componentContext: NezonComponentContext,
  ): Promise<NezonCommandContext> {
    const targetMessage = await this.getTargetMessage(componentContext);
    const channel = await this.getChannel(componentContext);
    
    const message: any = {
      message_id: componentContext.payload.message_id,
      channel_id: componentContext.payload.channel_id,
      sender_id: componentContext.payload.user_id,
    };

    const commandContext: NezonCommandContext = {
      message,
      client: componentContext.client,
      args: componentContext.params,
      cache: componentContext.cache ?? new Map<symbol, unknown>(),
      reply: async (...replyArgs) => {
        if (!targetMessage || typeof targetMessage.reply !== 'function') {
          return undefined;
        }
        return targetMessage.reply(...replyArgs);
      },
      getChannel: async () => channel,
      getClan: async () => {
        if (!channel) {
          return undefined;
        }
        try {
          return channel.clan;
        } catch {
          return undefined;
        }
      },
      getUser: async () => {
        if (!componentContext.payload.user_id) {
          return undefined;
        }
        try {
          const channel = await this.getChannel(componentContext);
          const clan = channel?.clan;
          if (clan?.users?.fetch) {
            return (await clan.users.fetch(componentContext.payload.user_id)) as User;
          }
        } catch {
          return undefined;
        }
        return undefined;
      },
      getMessage: async () => targetMessage ?? undefined,
      getMessageByIds: async (channelId: string, messageId: string) => {
        try {
          const ch = await componentContext.client.channels.fetch(channelId);
          if (ch?.messages?.fetch) {
            return (await ch.messages.fetch(messageId)) as Message;
          }
        } catch {
          return undefined;
        }
        return undefined;
      },
    };

    return commandContext;
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

  private createMatcher(
    definition: NezonComponentDefinition,
  ): (payload: MessageButtonClicked) => {
    matched: boolean;
    params: string[];
    namedParams?: Record<string, string>;
    match: RegExpMatchArray | null;
  } {
    const { options } = definition;
    const separator = options.separator ?? '_';
    const patternString =
      typeof options.pattern === 'string' ? options.pattern : null;
    const pattern =
      typeof options.pattern === 'string'
        ? new RegExp(options.pattern)
        : options.pattern ?? null;

    const hasNamedParams = patternString?.includes(':');
    let namedParamNames: string[] = [];
    let regexPattern: RegExp | null = null;

    if (hasNamedParams && patternString) {
      namedParamNames = (patternString.match(/:(\w+)/g) || []).map((m) =>
        m.substring(1),
      );
      const regexString = patternString
        .replace(/\//g, '\\/')
        .replace(/:\w+/g, '([^/]+)');
      regexPattern = new RegExp(`^${regexString}$`);
    }

    return (payload: MessageButtonClicked) => {
      const id = payload.button_id ?? '';
      if (!id) {
        return { matched: false, params: [], match: null };
      }
      if (options.id && options.id !== id) {
        return { matched: false, params: [], match: null };
      }

      let match: RegExpMatchArray | null = null;
      let namedParams: Record<string, string> | undefined = undefined;

      if (hasNamedParams && regexPattern) {
        match = id.match(regexPattern);
        if (!match) {
          return { matched: false, params: [], match: null };
        }
        namedParams = {};
        for (let i = 0; i < namedParamNames.length; i++) {
          if (match[i + 1]) {
            namedParams[namedParamNames[i]] = match[i + 1];
          }
        }
        const params = match.slice(1);
        return { matched: true, params, namedParams, match };
      }

      if (pattern) {
        match = id.match(pattern);
        if (!match) {
          return { matched: false, params: [], match: null };
        }
      }
      const params = id.split(separator);
      return { matched: true, params, namedParams, match };
    };
  }

  private isMessageButtonClicked(
    payload: unknown,
  ): payload is MessageButtonClicked {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as MessageButtonClicked).button_id === 'string' &&
      typeof (payload as MessageButtonClicked).channel_id === 'string' &&
      typeof (payload as MessageButtonClicked).message_id === 'string'
    );
  }

  private ensureCache(context: NezonComponentContext) {
    if (!context.cache) {
      context.cache = new Map<symbol, unknown>();
    }
    return context.cache;
  }

  private async getTargetMessage(context: NezonComponentContext) {
    return this.getOrSetCache(context, this.cacheKeys.message, async () => {
      try {
        const channel = await this.getChannel(context);
        if (!channel?.messages?.fetch) {
          return undefined;
        }
        return (await channel.messages.fetch(
          context.payload.message_id,
        )) as Message;
      } catch (error) {
        this.logger.warn(
          `failed to resolve component target for ${context.payload.message_id}`,
          (error as Error)?.stack,
        );
        return undefined;
      }
    });
  }

  private async getChannel(context: NezonComponentContext) {
    return this.getOrSetCache(context, this.cacheKeys.channel, async () => {
      try {
        if (!context.payload.channel_id) {
          return undefined;
        }
        const fetched = await context.client.channels.fetch(
          context.payload.channel_id,
        );
        return fetched as TextChannel;
      } catch (error) {
        this.logger.warn(
          `failed to resolve component channel for ${context.payload.channel_id}`,
          (error as Error)?.stack,
        );
        return undefined;
      }
    });
  }

  private async getOrSetCache<T>(
    context: NezonComponentContext,
    key: symbol,
    factory: () => Promise<T>,
  ): Promise<T> {
    const cache = this.ensureCache(context);
    if (cache.has(key)) {
      return cache.get(key) as T;
    }
    const value = await factory();
    cache.set(key, value);
    return value;
  }
}

