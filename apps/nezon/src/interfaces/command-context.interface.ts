import { ChannelMessage, MezonClient } from 'mezon-sdk';
import { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';

export interface NezonCommandContext {
  message: ChannelMessage;
  client: MezonClient;
  args: string[];
  cache?: Map<symbol, unknown>;
  reply(
    ...args: Parameters<Message['reply']>
  ): Promise<Awaited<ReturnType<Message['reply']>> | undefined>;
  getChannel(): Promise<TextChannel | undefined>;
  getClan(): Promise<Clan | undefined>;
  getUser(): Promise<User | undefined>;
  getMessage(): Promise<Message | undefined>;
  getMessageByIds(channelId: string, messageId: string): Promise<Message | undefined>;
}

