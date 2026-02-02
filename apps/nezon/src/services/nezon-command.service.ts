import {
  Inject,
  Injectable,
  Logger,
  type CanActivate,
  type Type,
} from '@nestjs/common';
import { ChannelMessage, Events } from 'mezon-sdk';
import type {
  ApiMessageRef,
  ChannelMessageContent,
  ReplyMessageData,
} from 'mezon-sdk/dist/cjs/interfaces/client';
import { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonExplorerService } from './nezon-explorer.service';
import { NezonUtilsService } from './nezon-utils.service';
import { NezonCommandDefinition } from '../interfaces/command-definition.interface';
import { NezonCommandContext } from '../interfaces/command-context.interface';
import { NEZON_MODULE_OPTIONS } from '../nezon-configurable';
import type {
  NezonModuleOptions,
  NezonRestrictConfig,
} from '../nezon.module-interface';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GUARDS_METADATA } from '@nestjs/common/constants';
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
} from '../messaging/smart-message';

@Injectable()
export class NezonCommandService {
  private readonly logger = new Logger(NezonCommandService.name);
  private commands: Array<{
    names: Set<string>;
    prefix: string;
    definition: NezonCommandDefinition;
  }> = [];
  private isInitialized = false;
  private readonly cacheKeys = {
    channel: Symbol('nezon:command:channel'),
    clan: Symbol('nezon:command:clan'),
    message: Symbol('nezon:command:message'),
    user: Symbol('nezon:command:user'),
    autoContext: Symbol('nezon:command:auto-context'),
  };

  constructor(
    private readonly explorer: NezonExplorerService,
    private readonly clientService: NezonClientService,
    private readonly utilsService: NezonUtilsService,
    @Inject(NEZON_MODULE_OPTIONS)
    private readonly moduleOptions: NezonModuleOptions,
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
  ) {}

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    const definitions = this.explorer.exploreCommands();
    this.registerCommands(definitions);
    await this.bindListener();
    this.isInitialized = true;
  }

  private registerCommands(definitions: NezonCommandDefinition[]) {
    this.commands = definitions.map((definition) => {
      const prefix = definition.options.prefix ?? '*';
      const baseName = definition.options.name.toLowerCase();
      const aliases =
        definition.options.aliases?.map((alias) => alias.toLowerCase()) ?? [];
      return {
        names: new Set([baseName, ...aliases]),
        prefix,
        definition,
      };
    });
  }

  private async bindListener() {
    const client = this.clientService.getClient();
    const eventName = Events.ChannelMessage.toString();
    const clientAny = client as any;
    const handlerKey = Symbol.for('nezon:command:channel-message-handler');
    const previousHandler = clientAny[handlerKey];
    if (typeof previousHandler === 'function') {
      client.removeListener(eventName, previousHandler);
    }
    const handler = async (message: ChannelMessage) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        const err = error as Error;
        const messageContent = this.extractMessageContent(message);
        this.logger.error(
          `Command execution failed for message: "${messageContent}"`,
          {
            error: err.message,
            stack: err.stack,
            messageId: message.id,
            channelId: message.channel_id,
            senderId: message.sender_id,
          },
        );
      }
    };
    clientAny[handlerKey] = handler;
    client.on(eventName, handler);
  }

  private async handleMessage(message: ChannelMessage) {
    if (!message) {
      return;
    }
    const rawContent = this.extractMessageContent(message);
    if (!rawContent) {
      return;
    }
    const content = rawContent.trim();
    if (!content) {
      return;
    }
    for (const command of this.commands) {
      if (!content.startsWith(command.prefix)) {
        continue;
      }
      const body = content.slice(command.prefix.length).trim();
      if (!body) {
        continue;
      }
      const parts = body.split(/\s+/);
      if (!parts.length) {
        continue;
      }
      const name = parts.shift()?.toLowerCase();
      if (!name || !command.names.has(name)) {
        continue;
      }
      const context = this.createCommandContext(message, parts);
      try {
        await this.executeCommand(command.definition, context);
      } catch (error) {
        const err = error as Error;
        const commandName = command.definition.options.name || 'unknown';
        this.logger.error(`Command "${commandName}" failed in handleMessage`, {
          error: err.message,
          stack: err.stack,
          messageId: message.id,
          channelId: message.channel_id,
        });
        throw error;
      }
      break;
    }
  }

  private async executeCommand(
    definition: NezonCommandDefinition,
    context: NezonCommandContext,
  ) {
    const method = definition.instance[definition.methodName];
    if (typeof method !== 'function') {
      return;
    }
    if (!this.isAllowedForContext(definition.restricts, context)) {
      return;
    }
    const guardsOk = await this.canActivateGuards(definition.instance, method, [
      context,
    ]);
    if (!guardsOk) {
      return;
    }
    const parameters = definition.parameters ?? [];
    try {
      if (!parameters.length) {
        await method.call(definition.instance, context);
        return;
      }
      const args = await this.resolveCommandArguments(parameters, context);
      await method.apply(definition.instance, args);
    } catch (error) {
      const err = error as Error;
      const commandName = definition.options.name || 'unknown';
      this.logger.error(
        `Command "${commandName}" execution failed in ${definition.instance.constructor.name}.${definition.methodName}`,
        {
          error: err.message,
          stack: err.stack,
          commandName,
          handlerClass: definition.instance.constructor.name,
          handlerMethod: definition.methodName,
          messageId: context.message.id,
          channelId: context.message.channel_id,
          senderId: context.message.sender_id,
        },
      );
      throw error;
    }
  }

  private async canActivateGuards(
    instance: any,
    handler: (...args: unknown[]) => unknown,
    args: unknown[],
  ): Promise<boolean> {
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

  private isAllowedForContext(
    restricts: NezonRestrictConfig | undefined,
    context: NezonCommandContext,
  ): boolean {
    const globalRestricts = this.moduleOptions.restricts;
    const merged = this.mergeRestricts(globalRestricts, restricts);
    if (!merged) {
      return true;
    }
    const clanId = context.message.clan_id;
    const channelId = context.message.channel_id;
    const userId = context.message.sender_id;
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

  private async resolveCommandArguments(
    parameters: NezonParameterMetadata[],
    context: NezonCommandContext,
  ) {
    const size = Math.max(...parameters.map((param) => param.index), -1) + 1;
    const args = new Array<unknown>(size).fill(undefined);
    for (const param of parameters) {
      const value = await this.resolveCommandParameter(param, context);
      args[param.index] = value;
    }
    return args;
  }

  private async resolveCommandParameter(
    param: NezonParameterMetadata,
    context: NezonCommandContext,
  ) {
    switch (param.type) {
      case NezonParamType.CONTEXT:
        return context;
      case NezonParamType.MESSAGE: {
        const message = context.message;
        if (typeof param.data === 'string' && param.data) {
          return (message as any)?.[param.data];
        }
        return message;
      }
      case NezonParamType.CLIENT:
        return context.client;
      case NezonParamType.ARGS:
        return context.args;
      case NezonParamType.ARG:
        return typeof param.data === 'number'
          ? context.args[param.data] ?? undefined
          : undefined;
      case NezonParamType.ATTACHMENTS: {
        const attachments = Array.isArray(context.message?.attachments)
          ? context.message.attachments
          : [];
        if (typeof param.data === 'number') {
          return attachments[param.data];
        }
        return attachments;
      }
      case NezonParamType.MENTIONS: {
        const mentions = Array.isArray(context.message?.mentions)
          ? context.message.mentions
          : [];
        if (typeof param.data === 'number') {
          return mentions[param.data];
        }
        return mentions;
      }
      case NezonParamType.MESSAGE_CONTENT:
        return this.extractMessageContent(context.message);
      case NezonParamType.CHANNEL: {
        const channel = await this.getChannel(context);
        if (typeof param.data === 'string' && param.data && channel) {
          return (channel as any)?.[param.data];
        }
        return channel;
      }
      case NezonParamType.CLAN:
        return this.getClan(context);
      case NezonParamType.USER: {
        const user = await this.getUser(context);
        if (typeof param.data === 'string' && param.data && user) {
          return (user as any)?.[param.data];
        }
        return user;
      }
      case NezonParamType.THIS_MESSAGE:
        return this.getMessageEntity(context);
      case NezonParamType.AUTO_CONTEXT: {
        const autoContext = await this.getAutoContext(context);
        if (typeof param.data === 'string' && param.data) {
          if (param.data === 'message') {
            return autoContext[0];
          }
          if (param.data === 'dm') {
            return autoContext[1];
          }
          if (param.data === 'channel') {
            return autoContext[2];
          }
        }
        return autoContext;
      }
      case NezonParamType.NEZON_UTILS:
        return this.utilsService;
      default:
        return undefined;
    }
  }

  private extractMessageContent(message: ChannelMessage) {
    const payload = message?.content;
    if (!payload) {
      return '';
    }
    if (typeof payload === 'string') {
      return payload;
    }
    if (typeof (payload as { t?: unknown }).t === 'string') {
      return (payload as { t: string }).t;
    }
    return '';
  }

  private ensureCache(context: NezonCommandContext) {
    if (!context.cache) {
      context.cache = new Map<symbol, unknown>();
    }
    return context.cache;
  }

  private async getOrSetCache<T>(
    context: NezonCommandContext,
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

  private async getChannel(context: NezonCommandContext) {
    return this.getOrSetCache(context, this.cacheKeys.channel, async () => {
      try {
        const { client, message } = context;
        if (!message.channel_id) {
          return undefined;
        }
        if (client.channels?.fetch) {
          const fetched = await client.channels.fetch(message.channel_id);
          if (fetched) {
            return fetched as TextChannel;
          }
        }
        const clan = await this.getClan(context);
        if (clan?.channels?.fetch) {
          return (await clan.channels.fetch(message.channel_id)) as TextChannel;
        }
      } catch (error) {
        this.logger.warn(
          `failed to resolve channel for ${context.message.channel_id}`,
          (error as Error)?.stack,
        );
      }
      return undefined;
    });
  }

  private async getClan(context: NezonCommandContext) {
    return this.getOrSetCache(context, this.cacheKeys.clan, async () => {
      try {
        const { client, message } = context;
        if (!message.clan_id) {
          return undefined;
        }
        const cached = client.clans?.get?.(message.clan_id) as Clan | undefined;
        if (cached) {
          return cached;
        }
        if (client.clans?.fetch) {
          return (await client.clans.fetch(message.clan_id)) as Clan;
        }
      } catch (error) {
        this.logger.warn(
          `failed to resolve clan for ${context.message.clan_id}`,
          (error as Error)?.stack,
        );
      }
      return undefined;
    });
  }

  private async getUser(context: NezonCommandContext) {
    return this.getOrSetCache(context, this.cacheKeys.user, async () => {
      try {
        const { message } = context;
        if (!message.sender_id) {
          return undefined;
        }
        const client = context.client as any;
        if (client.users?.fetch) {
          return (await client.users.fetch(message.sender_id)) as User;
        }
      } catch (error) {
        this.logger.warn(
          `failed to resolve user for ${context.message.sender_id}`,
          (error as Error)?.stack,
        );
      }
      return undefined;
    });
  }

  private async getMessageEntity(context: NezonCommandContext) {
    return this.getOrSetCache(context, this.cacheKeys.message, async () => {
      try {
        const { message } = context;
        if (!message.channel_id || !message.message_id) {
          return undefined;
        }
        const channel = await this.getChannel(context);
        if (channel?.messages?.fetch) {
          return (await channel.messages.fetch(message.message_id)) as Message;
        }
      } catch (error) {
        this.logger.warn(
          `failed to resolve message entity for ${context.message.message_id}`,
          (error as Error)?.stack,
        );
      }
      return undefined;
    });
  }

  private async getAutoContext(
    context: NezonCommandContext,
  ): Promise<[ManagedMessage, DMHelper, ChannelHelper]> {
    return this.getOrSetCache(context, this.cacheKeys.autoContext, async () => {
      const helpers = {
        normalize: (input) => this.normalizeSmartMessage(input),
      };
      return [
        new ManagedMessage(context, helpers),
        new DMHelper(context.client, helpers),
        new ChannelHelper(context, helpers),
      ];
    });
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

  private createCommandContext(
    message: ChannelMessage,
    args: string[],
  ): NezonCommandContext {
    const context: NezonCommandContext = {
      message,
      client: this.clientService.getClient(),
      args,
      cache: new Map<symbol, unknown>(),
      reply: async (
        content,
        mentions,
        attachments,
        mention_everyone,
        anonymous_message,
        topic_id = '0',
        code,
      ) => {
        const channelId = context.message.channel_id;
        if (!channelId) {
          return undefined;
        }

        const clanId = context.message.clan_id ?? '';
        let mode: number;
        if (typeof context.message.mode === 'number') {
          mode = context.message.mode;
        } else if (clanId) {
          mode = 2;
        } else {
          mode = 4;
        }
        const isPublic =
          typeof context.message.is_public === 'boolean'
            ? context.message.is_public
            : !!clanId;

        const clientAny = context.client as any;
        const socketManager = clientAny.socketManager;
        if (!socketManager || typeof socketManager.writeChatMessage !== 'function') {
          throw new Error('MezonClient socketManager is not available');
        }

        const messageRefId =
          context.message.message_id ?? context.message.id ?? '';
        const refs: ApiMessageRef[] =
          messageRefId && context.message.sender_id
            ? [
                {
                  message_ref_id: messageRefId,
                  ref_type: 0,
                  message_sender_id: context.message.sender_id,
                  message_sender_username: context.message.username,
                  mesages_sender_avatar: context.message.avatar,
                  message_sender_clan_nick: context.message.clan_nick,
                  message_sender_display_name: context.message.display_name,
                  content: JSON.stringify(context.message.content),
                  has_attachment:
                    Array.isArray(context.message.attachments) &&
                    context.message.attachments.length > 0,
                },
              ]
            : [];

        const data: ReplyMessageData = {
          clan_id: clanId,
          channel_id: channelId,
          mode,
          is_public: isPublic,
          content,
          mentions,
          attachments,
          references: refs,
          anonymous_message,
          mention_everyone,
          code,
          topic_id: topic_id || context.message.topic_id,
        };

        return await socketManager.writeChatMessage(data);
      },
      getChannel: () => this.getChannel(context),
      getClan: () => this.getClan(context),
      getUser: () => this.getUser(context),
      getMessage: () => this.getMessageEntity(context),
      getMessageByIds: (channelId: string, messageId: string) =>
        this.fetchMessageByIds(context.client, channelId, messageId),
    };
    return context;
  }

  private async fetchMessageByIds(
    client: NezonCommandContext['client'],
    channelId?: string,
    messageId?: string,
  ) {
    if (!channelId || !messageId) {
      return undefined;
    }
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.messages?.fetch) {
        return undefined;
      }
      return (await channel.messages.fetch(messageId)) as Message;
    } catch (error) {
      this.logger.warn(
        `failed to fetch message ${messageId} from channel ${channelId}`,
        (error as Error)?.stack,
      );
    }
    return undefined;
  }
}
