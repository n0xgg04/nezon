import { SmartMessage } from '@n0xgg04/nezon';
import type { MezonClient } from 'mezon-sdk';

export function getDMUtils(client: MezonClient) {
  return {
    send: async (userId: string, content: SmartMessage) => {
      if (!userId) {
        throw new Error('Cannot send DM: userId is null or undefined');
      }

      const clientAny = client as any;
      const payload = content.toContent();
      let dmChannelId: string | undefined;

      if (clientAny.createDMchannel) {
        try {
          const dmChannel = await clientAny.createDMchannel(userId);
          dmChannelId = dmChannel?.channel_id;
        } catch (error) {
          // Fallback to other methods
        }
      }

      if (!dmChannelId) {
        if (clientAny.users?.fetch) {
          try {
            const user = await clientAny.users.fetch(userId);
            if (user?.sendDM) {
              try {
                return await user.sendDM(payload, undefined, undefined);
              } catch (error) {
                const dmChannel = await (user as any).createDmChannel?.();
                if (dmChannel?.channel_id) {
                  dmChannelId = dmChannel.channel_id;
                }
              }
            }
          } catch (error) {
            throw new Error(
              `User ${userId} not found or can not create DM channel!`,
            );
          }
        } else {
          throw new Error(
            `User ${userId} not found or can not create DM channel!`,
          );
        }
      }

      if (!dmChannelId) {
        throw new Error(
          `Failed to create DM channel for user ${userId}. User may not exist or bot doesn't have permission.`,
        );
      }

      const channel = await clientAny.channels.fetch(dmChannelId);
      if (!channel) {
        throw new Error(`Failed to fetch DM channel ${dmChannelId}`);
      }

      return channel.send(payload, undefined, undefined);
    },
  };
}
