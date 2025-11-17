import type { MezonClient } from 'mezon-sdk';
import type { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import type { ManagedMessage } from '../messaging/smart-message';

export interface ButtonClickContext {
  message: ManagedMessage;
  channel: TextChannel | undefined;
  user: User | undefined;
  clan: Clan | undefined;
  client: MezonClient;
  formData?: Record<string, string>;
}
