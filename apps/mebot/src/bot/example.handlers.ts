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
            .setCustomId(`demo_button_success_${referenceId}`)
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success),
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
            .setCustomId(`demo_button_success`)
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
            .setColor('#f0a8da')
            .setTitle('Ăn chay sống thọ is in a battle!')
            .setThumbnail('https://cdn.mezon.ai/0/0/1832992916042158000/1758249992815IMG_8309.JPEG')
            .addField('linh.hoangnguyenngocduy', 'Lv. 49 - Capricorn', true)
            .addField('----------', 'Lv. 59 - White Tiger', true)
            .addField('----------', 'Lv. 53 - Azure Dragon', true)
            .addField('hoang.tranlehuy', 'Lv. 12 - Lunar Ox', true)
            .addField('----------', 'Lv. 11 - Lunar Dragon', true)
            .addField('----------', 'Lv. 12 - Aquarius', true)
            .setImage('https://res.cloudinary.com/do2rk0jz8/image/upload/v1761730208/Ainz%20Mezon%20Bot/Battle/hncaimiiiaoyuhljsasp.png')
            .setFooter('You WON in 11 turns! You gained 100 exp and 200 exp for each of your pets!'),
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
            .setCustomId('pollCreate_CANCEL')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId('pollCreate_ADD')
            .setLabel('Add Option')
            .setStyle(ButtonStyle.Primary),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId('pollCreate_CREATE')
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
            .setCustomId(`update_cancel_${messageId}`)
            .setLabel('Hủy')
            .setStyle(ButtonStyle.Danger),
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId(`update_success_${messageId}`)
            .setLabel('Thành công')
            .setStyle(ButtonStyle.Success),
        ),
    );
  }

  @Component({ pattern: '^update_cancel_.+' })
  async onUpdateCancel(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @Client() client: Nezon.Client,
    @ComponentTarget() targetMessage?: Nezon.Message,
  ) {
    if (!payload?.channel_id || !payload?.message_id) {
      return;
    }
    try {
      const message = targetMessage ?? (await this.getMessageByIds(client, payload));
      if (!message || typeof message.update !== 'function') {
        return;
      }
      await message.update(
        SmartMessage.text('Đã hủy').toContent(),
        undefined,
        undefined,
      );
    } catch (error) {
      this.logger.error(
        `failed to update message ${payload.message_id}`,
        (error as Error)?.stack,
      );
    }
  }

  @Component({ pattern: '^update_success_.+' })
  async onUpdateSuccess(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @Client() client: Nezon.Client,
    @ComponentTarget() targetMessage?: Nezon.Message,
  ) {
    if (!payload?.channel_id || !payload?.message_id) {
      return;
    }
    try {
      const message = targetMessage ?? (await this.getMessageByIds(client, payload));
      if (!message || typeof message.update !== 'function') {
        return;
      }
      await message.update(
        SmartMessage.text('Thành công').toContent(),
        undefined,
        undefined,
      );
    } catch (error) {
      this.logger.error(
        `failed to update message ${payload.message_id}`,
        (error as Error)?.stack,
      );
    }
  }

  @Component({ pattern: '^demo_button_success_.+' })
  async onDemoButtonClicked(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @ComponentParams() params: Nezon.ComponentParams,
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
