import { Injectable, Logger } from '@nestjs/common';
import { Events } from 'mezon-sdk';
import {
  Args,
  AutoContext,
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
  SmartMessage,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  User,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ExampleHandlers {
  private readonly logger = new Logger(ExampleHandlers.name);

  @Command({ name: 'ping', aliases: ['pong'] })
  async onPing(
    @Args() args: Nezon.Args,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    const suffix = args.length ? args.join(' ') : 'pong';
    await message.reply(SmartMessage.text(`✅ ${suffix}`));
  }

  @Command('button')
  async onButtonDemo(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    const referenceId = payload.message_id ?? message.id ?? 'unknown';
    await message.reply(
      SmartMessage.text('Click the button to confirm.')
        .addButton(
          new ButtonBuilder()
            .setCustomId(`/demo/success/${referenceId}`)
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success),
        ),
    );
  }

  @Command('onclick')
  async onClickDemo(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
      SmartMessage.text('Click the buttons below to see onClick handlers in action!')
        .addButton(
          new ButtonBuilder()
            .setLabel('Button 1 (onClick)')
            .setStyle(ButtonStyle.Primary)
            .onClick(async (context) => {
              await context.message.reply(SmartMessage.text('Button 1 was clicked!'));
            }),
        )
        .addButton(
          new ButtonBuilder()
            .setLabel('Button 2 (onClick)')
            .setStyle(ButtonStyle.Success)
            .onClick(async ({ channel, user, message }) => {
              const channelName = channel?.name ?? 'unknown';
              const userName = user?.username ?? 'unknown';
              await message.reply(
                SmartMessage.text(`Button 2 was clicked by ${userName} in ${channelName}!`),
              );
            }),
        ),
    );
  }

  @Component({ pattern: '/demo/success/:source_id' })
  async onDemoButtonClicked(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @ComponentParams('source_id') sourceId: string | undefined,
    @Client() client: Nezon.Client,
    @ComponentTarget() targetMessage?: Nezon.Message,
  ) {
    if (!payload?.channel_id || !payload?.message_id) {
      return;
    }
    try {
      const message = targetMessage ?? (await this.getMessageByIds(client, payload));
      if (!message) {
        return;
      }
      const resolvedSourceId = sourceId ?? payload.message_id;
      await message.reply(
        SmartMessage.text(`Button acknowledged from ${payload.user_id} (source ${resolvedSourceId}).`),
      );
    } catch (error) {
      this.logger.error(
        `failed to handle demo button for message ${payload.message_id}`,
        (error as Error)?.stack,
      );
    }
  }

  @On(Events.ChannelMessage)
  async logChannelMessage(
    @ChannelMessagePayload() message: Nezon.ChannelMessage,
    @MessageContent() content: string,
    @Channel() channel: Nezon.Channel | undefined,
    @User() user: Nezon.User | undefined,
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
    client: Nezon.Client,
    payload: Nezon.ComponentPayload,
  ) {
    try {
      const channel = await client.channels.fetch(payload.channel_id);
      return await channel.messages.fetch(payload.message_id);
    } catch {
      return undefined;
    }
  }
}

