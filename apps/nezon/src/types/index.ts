import type { ChannelMessage as MezonChannelMessage } from 'mezon-sdk';
import type { MezonClient } from 'mezon-sdk';
import type { Message as MezonMessage } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { TextChannel as MezonTextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Clan as MezonClan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { User as MezonUser } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import type { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

/**
 * Convenience namespace that re-exports the most common mezon-sdk types.
 * Consumers can import `Nezon` alongside the decorators to keep type hints consistent:
 *
 * ```ts
 * import { Command, Message } from '@n0xgg04/nezon';
 * import type { Nezon } from '@n0xgg04/nezon';
 *
 * @Command('ping')
 * async onPing(@Message() message: Nezon.Message) {
 *   await message.reply({ t: 'pong' });
 * }
 * ```
 */
export namespace Nezon {
  export type Client = MezonClient;
  export type ChannelMessage = MezonChannelMessage;
  export type Message = MezonMessage;
  export type Channel = MezonTextChannel;
  export type Clan = MezonClan;
  export type User = MezonUser;
  export type ComponentPayload = MessageButtonClicked;
  export type ComponentParams = string[];
  export type ComponentParam = string | undefined;
  export type Args = string[];
}
