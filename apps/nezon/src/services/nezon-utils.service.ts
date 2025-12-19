import { Injectable, Logger } from '@nestjs/common';
import { MezonClient, ChannelMessage } from 'mezon-sdk';
import type { ChannelMessageContent } from 'mezon-sdk/dist/cjs/interfaces/client';
import type { ApiMessageAttachment } from 'mezon-sdk/dist/cjs/interfaces/client';
import type { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import { NezonClientService } from '../client/nezon-client.service';
import {
  ManagedMessage,
  SmartMessage,
  type SmartMessageLike,
  type NormalizedSmartMessage,
  cloneMentionPlaceholders,
} from '../messaging/smart-message';
import type { NezonCommandContext } from '../interfaces/command-context.interface';

@Injectable()
export class NezonUtilsService {
  private readonly logger = new Logger(NezonUtilsService.name);

  constructor(private readonly clientService: NezonClientService) {}

  private get client(): MezonClient {
    return this.clientService.getClient();
  }

  async getClan(id: string): Promise<Clan | undefined> {
    try {
      const cached = this.client.clans?.get?.(id) as Clan | undefined;
      if (cached) {
        return cached;
      }
      if (this.client.clans?.fetch) {
        return (await this.client.clans.fetch(id)) as Clan;
      }
    } catch (error) {
      this.logger.warn(`failed to fetch clan ${id}`, (error as Error)?.stack);
    }
    return undefined;
  }

  async getChannel(id: string): Promise<TextChannel | undefined> {
    try {
      if (this.client.channels?.fetch) {
        const fetched = await this.client.channels.fetch(id);
        if (fetched) {
          return fetched as TextChannel;
        }
      }
    } catch (error) {
      this.logger.warn(
        `failed to fetch channel ${id}`,
        (error as Error)?.stack,
      );
    }
    return undefined;
  }

  async getMessage(
    id: string,
    channelId?: string,
  ): Promise<Message | undefined> {
    try {
      if (channelId) {
        const channel = await this.getChannel(channelId);
        if (channel?.messages?.fetch) {
          return (await channel.messages.fetch(id)) as Message;
        }
      } else {
        const channels = this.client.channels?.cache;
        if (channels) {
          for (const channel of channels.values()) {
            try {
              if (channel.messages?.fetch) {
                const message = await channel.messages.fetch(id);
                if (message) {
                  return message as Message;
                }
              }
            } catch {
              continue;
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `failed to fetch message ${id}`,
        (error as Error)?.stack,
      );
    }
    return undefined;
  }

  async sendToken(
    recipientId: string,
    amount: number,
    note?: string,
  ): Promise<{ ok: boolean; tx_hash: string; error: string } | undefined> {
    try {
      if (this.client.sendToken) {
        return await this.client.sendToken({
          receiver_id: recipientId,
          amount,
          note,
        });
      }
    } catch (error) {
      this.logger.warn(
        `failed to send token to ${recipientId}`,
        (error as Error)?.stack,
      );
    }
    return undefined;
  }

  async getManagedMessage(
    id: string,
    channelId?: string,
  ): Promise<ManagedMessage | undefined> {
    try {
      const message = await this.getMessage(id, channelId);
      if (!message) {
        return undefined;
      }

      const channel =
        message.channel ||
        (channelId ? await this.getChannel(channelId) : undefined);
      if (!channel) {
        return undefined;
      }

      const channelMessage: ChannelMessage = {
        id: message.id,
        message_id: message.id,
        channel_id: channel.id,
        channel_label: '',
        clan_id: channel.clan?.id || '',
        sender_id: message.sender_id || '',
        username: '',
        avatar: '',
        content: this.convertMessageContent(message.content),
        code: 0,
        create_time: message.create_time_seconds
          ? new Date(message.create_time_seconds * 1000).toISOString()
          : undefined,
        update_time: undefined,
        attachments: this.convertAttachments(message.attachments),
        mentions: this.convertMentions(message.mentions),
      } as ChannelMessage;

      const context = this.createContextFromMessage(
        channelMessage,
        message,
        channel,
      );
      const helpers = {
        normalize: (input: SmartMessageLike) =>
          this.normalizeSmartMessage(input),
      };

      return new ManagedMessage(context, helpers);
    } catch (error) {
      this.logger.warn(
        `failed to get managed message ${id}`,
        (error as Error)?.stack,
      );
    }
    return undefined;
  }

  private createContextFromMessage(
    channelMessage: ChannelMessage,
    messageEntity: Message,
    channel: TextChannel,
  ): NezonCommandContext {
    const cache = new Map<symbol, unknown>();
    cache.set(Symbol.for('message'), messageEntity);
    cache.set(Symbol.for('channel'), channel);
    if (channel.clan) {
      cache.set(Symbol.for('clan'), channel.clan);
    }

    return {
      message: channelMessage,
      client: this.client,
      args: [],
      cache,
      reply: async (...replyArgs) => {
        if (typeof messageEntity.reply === 'function') {
          return messageEntity.reply(...replyArgs);
        }
        return undefined;
      },
      getChannel: async () => channel,
      getClan: async () => channel.clan || undefined,
      getUser: async () => {
        if (!channelMessage.sender_id) {
          return undefined;
        }
        try {
          const client = this.client as any;
          if (client.users?.fetch) {
            return (await client.users.fetch(channelMessage.sender_id)) as User;
          }
        } catch {
          return undefined;
        }
        return undefined;
      },
      getMessage: async () => messageEntity,
      getMessageByIds: async (msgChannelId: string, msgId: string) => {
        try {
          const msgChannel = await this.getChannel(msgChannelId);
          if (msgChannel?.messages?.fetch) {
            return (await msgChannel.messages.fetch(msgId)) as Message;
          }
        } catch {
          return undefined;
        }
        return undefined;
      },
    };
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

  private convertMessageContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (
      content &&
      typeof content === 'object' &&
      't' in content &&
      typeof (content as { t: unknown }).t === 'string'
    ) {
      return (content as { t: string }).t;
    }
    return '';
  }

  private convertAttachments(
    attachments: unknown,
  ): ApiMessageAttachment[] | undefined {
    if (Array.isArray(attachments)) {
      return attachments as ApiMessageAttachment[];
    }
    return undefined;
  }

  private convertMentions(
    mentions: unknown,
  ): Array<{ user_id: string }> | undefined {
    if (Array.isArray(mentions)) {
      return mentions.map((m) => {
        if (typeof m === 'object' && m !== null && 'user_id' in m) {
          return { user_id: String((m as { user_id: unknown }).user_id) };
        }
        return { user_id: String(m) };
      });
    }
    return undefined;
  }
}
