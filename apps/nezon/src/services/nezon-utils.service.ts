import { Injectable, Logger } from '@nestjs/common';
import { MezonClient } from 'mezon-sdk';
import type { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { NezonClientService } from '../client/nezon-client.service';

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
      this.logger.warn(
        `failed to fetch clan ${id}`,
        (error as Error)?.stack,
      );
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

  async getMessage(id: string, channelId?: string): Promise<Message | undefined> {
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
}

