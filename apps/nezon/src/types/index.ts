import type { ChannelMessage as MezonChannelMessage } from 'mezon-sdk';
import type { MezonClient } from 'mezon-sdk';
import type { TokenSentEvent } from 'mezon-sdk';
import type { Message as MezonMessage } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { TextChannel as MezonTextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Clan as MezonClan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { User as MezonUser } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import type {
  MessageButtonClicked,
  UserChannelRemoved,
  ChannelCreatedEvent,
  ChannelDeletedEvent,
  ChannelUpdatedEvent,
  RoleEvent,
  RoleAssignedEvent,
  AddClanUserEvent,
  StreamingJoinedEvent,
  StreamingLeavedEvent,
  DropdownBoxSelected,
  WebrtcSignalingFwd,
  VoiceStartedEvent,
  VoiceEndedEvent,
  VoiceJoinedEvent,
  VoiceLeavedEvent,
  Notifications,
  QuickMenuDataEvent,
} from 'mezon-sdk/dist/cjs/rtapi/realtime';
import type {
  MessageReaction,
  UserClanRemovedEvent,
  UserChannelAddedEvent,
  GiveCoffeeEvent,
} from 'mezon-sdk/dist/cjs/interfaces/socket';
import type {
  StreamingJoinedEvent as ClientStreamingJoinedEvent,
  StreamingLeavedEvent as ClientStreamingLeavedEvent,
} from 'mezon-sdk/dist/cjs/interfaces/client';
import * as Messaging from '../messaging/smart-message';
import type {
  ManagedMessage as ManagedMessageType,
  DMHelper as DMHelperType,
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
  export type AutoContext = [ManagedMessageType, DMHelperType];
  export type SmartMessageInput = SmartMessageLike;
  export const SmartMessage = Messaging.SmartMessage;
  export type ManagedMessage = ManagedMessageType;
  export type DMHelper = DMHelperType;
  export type Button = ButtonComponent;
  export const ButtonBuilder = ButtonModule.ButtonBuilder;
  export const ButtonStyle = ButtonModule.ButtonStyle;
  export type Embed = EmbedData;
  export const EmbedBuilder = EmbedModule.EmbedBuilder;
  export type TokenSendPayload = TokenSentEvent;
  export type AddClanUserPayload = AddClanUserEvent;
  export type MessageReactionPayload = MessageReaction;
  export type UserChannelRemovedPayload = UserChannelRemoved;
  export type UserClanRemovedPayload = UserClanRemovedEvent;
  export type UserChannelAddedPayload = UserChannelAddedEvent;
  export type ChannelCreatedPayload = ChannelCreatedEvent;
  export type ChannelDeletedPayload = ChannelDeletedEvent;
  export type ChannelUpdatedPayload = ChannelUpdatedEvent;
  export type RoleEventPayload = RoleEvent;
  export type GiveCoffeePayload = GiveCoffeeEvent;
  export type RoleAssignPayload = RoleAssignedEvent;
  export type StreamingJoinedPayload = StreamingJoinedEvent | ClientStreamingJoinedEvent;
  export type StreamingLeavedPayload = StreamingLeavedEvent | ClientStreamingLeavedEvent;
  export type DropdownBoxSelectedPayload = DropdownBoxSelected;
  export type WebrtcSignalingFwdPayload = WebrtcSignalingFwd;
  export type VoiceStartedPayload = VoiceStartedEvent;
  export type VoiceEndedPayload = VoiceEndedEvent;
  export type VoiceJoinedPayload = VoiceJoinedEvent;
  export type VoiceLeavedPayload = VoiceLeavedEvent;
  export type NotificationsPayload = Notifications;
  export type QuickMenuPayload = QuickMenuDataEvent;
}
