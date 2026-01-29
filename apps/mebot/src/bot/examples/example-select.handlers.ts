import { Injectable } from '@nestjs/common';
import {
  AutoContext,
  Command,
  EmbedBuilder,
  EventPayload,
  On,
  SmartMessage,
} from '@n0xgg04/nezon';
import { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ExampleSelectHandlers {
  @Command('dropdown')
  async onDropdown(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    console.log('[dropdown] Handler called!');
    try {
      console.log('[dropdown] Command received, creating embed...');
      const embed = new EmbedBuilder()
        .setColor('#0ea5e9')
        .setTitle('Dropdown Example')
        .setDescription('Hãy chọn một option từ dropdown bên dưới:')
        .addSelectField(
          'Chọn loại',
          'dropdown_type',
          [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
            { label: 'Option 3', value: 'option_3' },
          ],
          'option_1',
        );

      console.log(
        '[dropdown] Embed built:',
        JSON.stringify(embed.build(), null, 2),
      );
      const message = SmartMessage.text('hihi').addEmbed(embed);
      console.log(
        '[dropdown] Message content:',
        JSON.stringify(message.toContent(), null, 2),
      );
      await managedMessage.reply(message);
      console.log('[dropdown] Message sent successfully');
    } catch (error) {
      console.error('[dropdown] Error:', error);
      if (error instanceof Error) {
        console.error('[dropdown] Error stack:', error.stack);
      }
      throw error;
    }
  }

  @Command('select-demo')
  async onSelectDemo(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.build().addEmbed(
        new EmbedBuilder()
          .setTitle('Dropdown demo')
          .setDescription('Chọn một option trong dropdown bên dưới')
          .addSelectField(
            'Type',
            'type',
            [
              { label: 'Option 1', value: 'option_1' },
              { label: 'Option 2', value: 'option_2' },
              { label: 'Option 3', value: 'option_3' },
            ],
            'option_1',
          ),
      ),
    );
  }

  @On(Nezon.Events.DropdownBoxSelected)
  async onDropdownSelected(
    @EventPayload() payload: Nezon.DropdownBoxSelectedPayload,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
  ) {
    const record = payload as unknown as Record<string, unknown>;
    const userId =
      (record.user_id as string | undefined) ??
      (record.sender_id as string | undefined) ??
      'unknown';
    const selected =
      (record.value as string | undefined) ??
      (record.value_selected as string | undefined) ??
      (record.valueSelected as string | undefined) ??
      (record.selected as string | undefined) ??
      'unknown';
    const field =
      (record.id as string | undefined) ??
      (record.input_id as string | undefined) ??
      (record.field as string | undefined) ??
      'unknown';

    await managedMessage.reply(
      SmartMessage.text(
        `Dropdown selected\nField: ${field}\nValue: ${selected}\nUser: ${userId}`,
      ),
    );
  }
}
