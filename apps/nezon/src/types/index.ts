import type { ChannelMessage as MezonChannelMessage } from 'mezon-sdk';
import type { MezonClient } from 'mezon-sdk';
import type { Message as MezonMessage } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { TextChannel as MezonTextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Clan as MezonClan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { User as MezonUser } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import type { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import * as Messaging from '../messaging/smart-message';
import type {
  ManagedMessage as ManagedMessageType,
  SmartMessageLike,
} from '../messaging/smart-message';
import * as ButtonModule from '../messaging/button-builder';
import type { ButtonComponent } from '../messaging/button-builder';
import * as EmbedModule from '../messaging/embed-builder';
import type { EmbedData } from '../messaging/embed-builder';

/**
 * Convenience namespace that re-exports the most common mezon-sdk types and
 * Nezon-specific helpers. Consumers can import `Nezon` alongside the decorators
 * to keep type hints consistent:
 *
 * ```ts
 * import { Command, AutoContext } from '@n0xgg04/nezon';
 * import type { Nezon } from '@n0xgg04/nezon';
 *
 * @Command('ping')
 * async onPing(@AutoContext() [message]: Nezon.AutoContext) {
 *   await message.reply(Nezon.SmartMessage.text('pong'));
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
  export type ComponentParams = string[] | Record<string, string>;
  export type ComponentParam = string | undefined;
  export type Args = string[];
  export type AutoContext = [ManagedMessageType];
  export type SmartMessageInput = SmartMessageLike;
  export const SmartMessage = Messaging.SmartMessage;
  export type ManagedMessage = ManagedMessageType;
  export type Button = ButtonComponent;
  export const ButtonBuilder = ButtonModule.ButtonBuilder;
  export const ButtonStyle = ButtonModule.ButtonStyle;
  export type Embed = EmbedData;
  export const EmbedBuilder = EmbedModule.EmbedBuilder;
}
