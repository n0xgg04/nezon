import { Injectable, Logger } from '@nestjs/common';
import { ChannelMessage, Events } from 'mezon-sdk';
import type { ChannelMessageContent } from 'mezon-sdk/dist/cjs/interfaces/client';
import { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import { NezonClientService } from '../client/nezon-client.service';
import { NezonExplorerService } from './nezon-explorer.service';
import { NezonCommandDefinition } from '../interfaces/command-definition.interface';
import { NezonCommandContext } from '../interfaces/command-context.interface';
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
    if (typeof (client as any).onChannelMessage === 'function') {
      await client.onChannelMessage(async (message: ChannelMessage) => {
        try {
          await this.handleMessage(message);
        } catch (error) {
          const err = error as Error;
          this.logger.error('command execution failed', err?.stack);
        }
      });

      return;
    }
    client.on(Events.ChannelMessage, async (message: ChannelMessage) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        const err = error as Error;
        this.logger.error('command execution failed', err?.stack);
      }
    });
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
      await this.executeCommand(command.definition, context);
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
    const parameters = definition.parameters ?? [];
    if (!parameters.length) {
      await method.call(definition.instance, context);
      return;
    }
    const args = await this.resolveCommandArguments(parameters, context);
    await method.apply(definition.instance, args);
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
        const clan = await this.getClan(context);
        if (clan?.users?.fetch) {
          return (await clan.users.fetch(message.sender_id)) as User;
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
      reply: async (...replyArgs) => {
        const entity = await this.getMessageEntity(context);
        if (!entity) {
          return undefined;
        }
        return await entity.reply(...replyArgs);
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
