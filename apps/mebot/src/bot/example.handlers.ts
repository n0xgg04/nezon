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
    await message.reply(
      SmartMessage.system(`ehehhe`),
    );
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
  async onClickDemo(
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
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
            .onClick(async ({ channel, user, message}) => {
              await message.reply(
                SmartMessage.text(`Button 2 was clicked by ${user.display_name} in ${channel.name}!`),
              );
            }),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId('/demo/success/onclick-static')
            .setLabel('Button 3 (setCustomId)')
            .setStyle(ButtonStyle.Secondary),
        ),
    );
  }

  @Command('image')
  async onImageDemo(
    @Args() args: Nezon.Args,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    const imageUrl = args[0] || 'https://picsum.photos/800/600';
    await message.reply(
      SmartMessage.text('Here are some example images!')
        .addImage(imageUrl, {
          filename: 'example1.jpg',
          width: 800,
          height: 600,
        })
        .addImage('https://picsum.photos/400/300', {
          filename: 'example2.jpg',
          width: 400,
          height: 300,
        }).addButton(
          new ButtonBuilder()
            .setCustomId('/demo/success/static')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Link),
        ),
    );
  }

  @Command('embed')
  async onEmbedDemo(
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.reply(
      SmartMessage.text('')
        .addEmbed(
          new EmbedBuilder()
            .setColor('#abcdef')
            .setTitle('Example Embed Title')
            .setThumbnail('https://example.com/example-thumbnail.jpg')
            .addField('Field 1', 'Value 1', true)
            .addField('Field 2', 'Value 2', true)
            .addField('Field 3', 'Value 3', true)
            .setImage('https://example.com/example-image.jpg')
            .setFooter('Example footer text'),
        ),
    );
  }

  @Command('form')
  async onFormDemo(
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.reply(
      SmartMessage.build()
        .addEmbed(
          new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle('POLL CREATOR')
            .addTextField('Title', 'title', {
              placeholder: 'Input title here',
              defaultValue: '',
            })
            .addTextField('Option 1️⃣', 'option_1', {
              placeholder: 'Input option 1 here',
              defaultValue: '',
            })
            .addTextField('Option 2️⃣', 'option_2', {
              placeholder: 'Input option 2 here',
              defaultValue: '',
            })
            .addSelectField('Type', 'type', [
              { label: 'Single choice', value: 'SINGLE' },
              { label: 'Multiple choice', value: 'MULTIPLE' },
            ], 'SINGLE')
            .addTextField('Expired Time (hour) - Default: 168 hours (7 days)', 'expired', {
              placeholder: 'Input expired time here',
              defaultValue: 168,
              isNumber: true,
            })
            .setTimestamp()
            .setFooter('Powered by Mezon', 'https://cdn.mezon.vn/1837043892743049216/1840654271217930240/1827994776956309500/857_0246x0w.webp'),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId('/poll/cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId('/poll/add-option')
            .setLabel('Add Option')
            .setStyle(ButtonStyle.Primary),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId('/poll/create')
            .setLabel('Create')
            .setStyle(ButtonStyle.Success),
        ),
    );
  }

  @Command('file')
  async onFileDemo(
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.reply(
      SmartMessage.text('Here is a file attachment!')
        .addFile(
          'https://cdn.mezon.ai/1779484504377790464/1840658523503988736/1838769001518338000/1762397837280_apps.apple.com_main.zip',
          'apps.apple.com-main.zip',
          'application/x-zip-compressed',
          { size: 3215230 },
        ),
    );
  }

  @Command('prompt')
  async onPrompt(
    @Args() args: Nezon.Args,
    @AutoContext() [message]: Nezon.AutoContext,
    @User() user?: Nezon.User,
    @MessageContent() content?: string,
  ) {
    const userText = args.length ? args.join(' ') : '';
    const userId = user?.id ?? 'unknown';
    await message.reply(
      SmartMessage.text(`User ID: ${userId}\nTin nhắn: ${content ?? userText}`),
    );
  }

  @Command('dm')
  async onDMDemo(
    @Args() args: Nezon.Args,
    @AutoContext('message') message: Nezon.AutoContextType.Message,
    @AutoContext('dm') dm: Nezon.AutoContextType.DM,
    @User() user?: Nezon.User,
  ) {
    const targetUserId = args[0];
    
    if (!targetUserId) {
      await message.reply(
        SmartMessage.text('Sử dụng: *dm <user_id>\n\nHoặc dùng *senddm để gửi DM cho người gửi tin nhắn này.'),
      );
      return;
    }

    try {
      await dm.send(
        targetUserId,
        SmartMessage.text('Đây là tin nhắn DM được gửi từ bot!'),
      );
      await message.reply(
        SmartMessage.text(`✅ Đã gửi DM đến user ${targetUserId}`),
      );
    } catch (error) {
      await message.reply(
        SmartMessage.text(`❌ Lỗi khi gửi DM: ${(error as Error).message}`),
      );
    }
  }

  @Command('senddm')
  async onSendDMToSender(
    @AutoContext('message') message: Nezon.AutoContextType.Message,
    @User() user?: Nezon.User,
  ) {
    try {
      await message.sendDM(
        SmartMessage.text('Đây là tin nhắn DM được gửi tự động cho bạn!'),
      );
      await message.reply(
        SmartMessage.text(`✅ Đã gửi DM đến ${user?.username ?? user?.display_name ?? 'bạn'}`),
      );
    } catch (error) {
      await message.reply(
        SmartMessage.text(`❌ Lỗi khi gửi DM: ${(error as Error).message}`),
      );
    }
  }

  @Command('update')
  async onUpdateDemo(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    const messageId = payload.message_id ?? message.id ?? 'unknown';
    await message.reply(
      SmartMessage.text('Chọn một hành động:')
        .addImage('https://picsum.photos/800/600', {
          filename: 'example.jpg',
        })
        .addButton(
          new ButtonBuilder()
            .setCustomId(`/update/${messageId}/cancel`)
            .setLabel('Hủy')
            .setStyle(ButtonStyle.Danger),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId(`/update/${messageId}/success`)
            .setLabel('Thành công')
            .setStyle(ButtonStyle.Success),
        ),
    );
  }

  @Component({ pattern: '/update/:message_id/cancel' })
  async onUpdateCancel(
    @ComponentParams('message_id') targetId: string | undefined,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.update(SmartMessage.text('Đã hủy'));
    if (targetId) {
      this.logger.verbose(`update cancel triggered for message ${targetId}`);
    }
  }

  @Component({ pattern: '/update/:message_id/success' })
  async onUpdateSuccess(
    @ComponentParams('message_id') targetId: string | undefined,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.update(SmartMessage.text('Thành công'));
    if (targetId) {
      this.logger.verbose(`update success triggered for message ${targetId}`);
    }
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
      await message.reply({
        t: `Button acknowledged from ${payload.user_id} (source ${resolvedSourceId}).`,
      });
    } catch (error) {
      this.logger.error(
        `failed to handle demo button for message ${payload.message_id}`,
        (error as Error)?.stack,
      );
    }
  }

  @Component({ pattern: '/user/:user_id/:action' })
  async onUserAction(
    @AutoContext() [message]: Nezon.AutoContext,
    @ComponentParams() allParams: Record<string, string> | string[],
    @ComponentParams('user_id') userId: string,
    @ComponentParams('action') action: string,
  ) {
    await message.reply(
      SmartMessage.text(
        `User ID: ${userId}\nAction: ${action}\nAll params: ${JSON.stringify(allParams)}`,
      ),
    );
  }

  @On(Events.ChannelMessage)
  async logChannelMessage(
    @ChannelMessagePayload() message: Nezon.ChannelMessage,
    @ChannelMessagePayload('message_id') messageId: string | undefined,
    @MessageContent() content: string,
    @Channel() channel: Nezon.Channel | undefined,
    @Channel('id') channelId: string | undefined,
    @User() user: Nezon.User | undefined,
    @User('avartar') username: string | undefined,
  ) {
    const channelLabel = channelId ?? channel?.id ?? message.channel_id ?? 'unknown';
    const author =
      username ??
      user?.username ??
      message.username ??
      message.display_name ??
      message.sender_id ??
      'unknown';
    this.logger.verbose(
      `message ${messageId ?? message.message_id ?? 'unknown'} received from ${author} in channel ${channelLabel}: ${content}`,
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
