import {
  Inject,
  Injectable,
  Logger,
  type CanActivate,
  type Type,
} from '@nestjs/common';
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
  ChannelHelper,
  SmartMessage,
  SmartMessageLike,
  NormalizedSmartMessage,
  cloneMentionPlaceholders,
  getButtonClickRegistry,
} from '../messaging/smart-message';
import { NezonCommandContext } from '../interfaces/command-context.interface';
import type { ButtonClickContext } from '../interfaces/button-click-context.interface';
import { NEZON_MODULE_OPTIONS } from '../nezon-configurable';
import type {
  NezonModuleOptions,
  NezonRestrictConfig,
} from '../nezon.module-interface';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GUARDS_METADATA } from '@nestjs/common/constants';

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
    formData: Symbol('nezon:component:formData'),
  };

  constructor(
    private readonly explorer: NezonExplorerService,
    private readonly clientService: NezonClientService,
    @Inject(NEZON_MODULE_OPTIONS)
    private readonly moduleOptions: NezonModuleOptions,
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
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
      const event = definition.options.event ?? Events.MessageButtonClicked;
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
          const clickContext = await this.createButtonClickContext(
            componentContext,
          );
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
      if (
        !this.isAllowedForPayload(registration.definition.restricts, payload)
      ) {
        continue;
      }
      const { matched, params, namedParams, match } =
        registration.matcher(payload);
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
      const guardsOk = await this.canActivateGuards(
        registration.definition.instance,
        registration.definition.methodName,
        [context],
      );
      if (!guardsOk) {
        continue;
      }
      try {
        await this.executeComponent(registration.definition, context);
      } catch (error) {
        const err = error as Error;
        this.logger.error('component handler failed', err?.stack);
      }
    }
  }

  private async canActivateGuards(
    instance: any,
    handlerName: string,
    args: unknown[],
  ): Promise<boolean> {
    const handler = instance[handlerName] as
      | ((...args: unknown[]) => unknown)
      | undefined;
    if (!handler) {
      return true;
    }
    const guards =
      this.reflector.getAllAndOverride<Array<Type<CanActivate> | CanActivate>>(
        GUARDS_METADATA,
        [handler, instance.constructor],
      ) ?? [];
    if (!guards.length) {
      return true;
    }
    const context = new ExecutionContextHost(
      args,
      instance.constructor,
      handler,
    );
    context.setType('rpc');
    for (const guard of guards) {
      const guardInstance = this.getGuardInstance(guard);
      const result = await guardInstance.canActivate(context);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private getGuardInstance(
    guard: Type<CanActivate> | CanActivate,
  ): CanActivate {
    if (typeof (guard as CanActivate).canActivate === 'function') {
      return guard as CanActivate;
    }
    const type = guard as Type<CanActivate>;
    try {
      return this.moduleRef.get(type, { strict: false });
    } catch {
      return new type();
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

  private isAllowedForPayload(
    restricts: NezonRestrictConfig | undefined,
    payload: MessageButtonClicked,
  ): boolean {
    const globalRestricts = this.moduleOptions.restricts;
    const merged = this.mergeRestricts(globalRestricts, restricts);
    if (!merged) {
      return true;
    }
    const clanId: string | undefined = (payload as any).clan_id;
    const channelId: string | undefined = (payload as any).channel_id;
    const userId: string | undefined = (payload as any).user_id;
    if (
      merged.clans &&
      merged.clans.length &&
      (!clanId || !merged.clans.includes(clanId))
    ) {
      return false;
    }
    if (
      merged.channels &&
      merged.channels.length &&
      (!channelId || !merged.channels.includes(channelId))
    ) {
      return false;
    }
    if (
      merged.users &&
      merged.users.length &&
      (!userId || !merged.users.includes(userId))
    ) {
      return false;
    }
    return true;
  }

  private mergeRestricts(
    base?: NezonRestrictConfig,
    override?: NezonRestrictConfig,
  ): NezonRestrictConfig | undefined {
    if (!base && !override) {
      return undefined;
    }
    const clans = [...(base?.clans ?? []), ...(override?.clans ?? [])];
    const channels = [...(base?.channels ?? []), ...(override?.channels ?? [])];
    const users = [...(base?.users ?? []), ...(override?.users ?? [])];
    const result: NezonRestrictConfig = {};
    if (clans.length) {
      result.clans = Array.from(new Set(clans));
    }
    if (channels.length) {
      result.channels = Array.from(new Set(channels));
    }
    if (users.length) {
      result.users = Array.from(new Set(users));
    }
    if (
      !result.clans?.length &&
      !result.channels?.length &&
      !result.users?.length
    ) {
      return undefined;
    }
    return result;
  }

  private async resolveComponentArguments(
    parameters: NezonParameterMetadata[],
    context: NezonComponentContext,
  ) {
    const size = Math.max(...parameters.map((param) => param.index), -1) + 1;
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
          const attachments = Array.isArray(
            (context.payload as any)?.attachments,
          )
            ? (context.payload as any).attachments
            : [];
          value =
            typeof param.data === 'number'
              ? attachments[param.data]
              : attachments;
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
        case NezonParamType.FORM_DATA: {
          const formData = await this.getFormData(context);
          if (typeof param.data === 'string' && param.data) {
            value = formData ? formData[param.data] : undefined;
          } else {
            value = formData;
          }
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
            } else if (param.data === 'channel') {
              value = autoContext[2];
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
    return this.getOrSetCache(
      context,
      Symbol('nezon:component:user'),
      async () => {
        if (!context.payload.user_id) {
          return undefined;
        }
        try {
          const client = context.client as any;
          if (client.users?.fetch) {
            return (await client.users.fetch(context.payload.user_id)) as User;
          }
        } catch {
          return undefined;
        }
        return undefined;
      },
    );
  }

  private async getFormData(
    context: NezonComponentContext,
  ): Promise<Record<string, string> | undefined> {
    return this.getOrSetCache(context, this.cacheKeys.formData, async () => {
      const raw = (context.payload as any)?.extra_data;
      if (typeof raw !== 'string' || !raw.trim()) {
        return undefined;
      }
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
          return undefined;
        }
        const formData: Record<string, string> = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (value === undefined || value === null) {
            return;
          }
          if (typeof value === 'string') {
            formData[key] = value;
            return;
          }
          if (typeof value === 'number' || typeof value === 'boolean') {
            formData[key] = String(value);
            return;
          }
          formData[key] = JSON.stringify(value);
        });
        return Object.keys(formData).length ? formData : undefined;
      } catch (error) {
        this.logger.warn(
          `failed to parse form data for component ${
            context.payload.button_id ?? 'unknown'
          }`,
          (error as Error)?.stack,
        );
        return undefined;
      }
    });
  }

  private async getAutoContext(
    context: NezonComponentContext,
  ): Promise<[ManagedMessage, DMHelper, ChannelHelper]> {
    return this.getOrSetCache(context, this.cacheKeys.autoContext, async () => {
      const commandContext = await this.createCommandContextFromComponent(
        context,
      );
      const helpers = {
        normalize: (input) => this.normalizeSmartMessage(input),
      };
      return [
        new ManagedMessage(commandContext, helpers),
        new DMHelper(context.client, helpers),
        new ChannelHelper(commandContext, helpers),
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
    const formData = await this.getFormData(componentContext);

    return {
      message,
      channel: channel ?? undefined,
      user: user ?? undefined,
      clan: clan ?? undefined,
      client: componentContext.client,
      formData,
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
          const client = componentContext.client as any;
          if (client.users?.fetch) {
            return (await client.users.fetch(
              componentContext.payload.user_id,
            )) as User;
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
        mentions: normalized.mentions?.map((mention) => ({ ...mention })),
        mentionPlaceholders: cloneMentionPlaceholders(
          normalized.mentionPlaceholders,
        ),
      };
    }
    if (input && typeof input === 'object') {
      return { content: input as ChannelMessageContent };
    }
    return { content: { t: String(input ?? '') } };
  }

  private createMatcher(definition: NezonComponentDefinition): (
    payload: MessageButtonClicked,
  ) => {
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
