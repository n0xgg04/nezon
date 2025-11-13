import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelMessage as ChannelMessageEvent,
  EButtonMessageStyle,
  EMessageComponentType,
  Events,
  MezonClient,
} from 'mezon-sdk';
import { Message as MezonMessage } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import {
  Args,
  Channel,
  Client,
  Command,
  Component,
  ComponentParams,
  ComponentPayload,
  ComponentTarget,
  ChannelMessagePayload,
  MessageContent,
  On,
  NezonMessage,
  NezonUser,
} from '@n0xgg04/nezon';

@Injectable()
export class ExampleHandlers {
  private readonly logger = new Logger(ExampleHandlers.name);

  @Command({ name: 'ping', aliases: ['pong'] })
  async onPing(
    @Args() args: string[],
    @NezonMessage() messageEntity?: MezonMessage,
  ) {
    if (!messageEntity) {
      return;
    }
    const suffix = args.length ? args.join(' ') : 'pong';
    await messageEntity.reply({ t: `✅ ${suffix}` });
  }

  @Command('button')
  async onButtonDemo(
    @ChannelMessagePayload() message: ChannelMessageEvent,
    @NezonMessage() messageEntity?: MezonMessage,
  ) {
    if (!messageEntity) {
      return;
    }
    const referenceId = message.message_id ?? messageEntity.id;
    const components = [
      {
        components: [
          {
            id: `demo_button_success_${referenceId}`,
            type: EMessageComponentType.BUTTON,
            component: {
              label: 'Confirm',
              style: EButtonMessageStyle.SUCCESS,
            },
          },
        ],
      },
    ];
    await messageEntity.reply({
      t: 'Click the button to confirm.',
      components,
    });
  }

  @Component({ pattern: '^demo_button_success_.+' })
  async onDemoButtonClicked(
    @ComponentPayload() payload: MessageButtonClicked,
    @ComponentParams() params: string[],
    @Client() client: MezonClient,
    @ComponentTarget() targetMessage?: MezonMessage,
  ) {
    if (!payload?.channel_id || !payload?.message_id) {
      return;
    }
    try {
      const message = targetMessage ?? (await this.getMessageByIds(client, payload));
      if (!message) {
        return;
      }
      const sourceId = params.at(-1) ?? payload.message_id;
      await message.reply({
        t: `Button acknowledged from ${payload.user_id} (source ${sourceId}).`,
      });
    } catch (error) {
      this.logger.error(
        `failed to handle button click for message ${payload.message_id}`,
        (error as Error)?.stack,
      );
    }
  }

  @On(Events.ChannelMessage)
  async logChannelMessage(
    @ChannelMessagePayload() message: ChannelMessageEvent,
    @MessageContent() content: string,
    @Channel() channel: TextChannel | undefined,
    @NezonUser() user: User | undefined,
  ) {
    const channelLabel = channel?.id ?? message.channel_id ?? 'unknown';
    const author =
      user?.username ??
      message.username ??
      message.display_name ??
      message.sender_id ??
      'unknown';
    this.logger.verbose(
      `message ${message.message_id ?? 'unknown'} received from ${author} in channel ${channelLabel}: ${content}`,
    );
  }

  private async getMessageByIds(
    client: MezonClient,
    payload: MessageButtonClicked,
  ) {
    try {
      const channel = await client.channels.fetch(payload.channel_id);
      return await channel.messages.fetch(payload.message_id);
    } catch {
      return undefined;
    }
  }
}

