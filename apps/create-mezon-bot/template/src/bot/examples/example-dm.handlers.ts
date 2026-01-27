import { Injectable } from '@nestjs/common';
import {
  Args,
  AutoContext,
  Client,
  Command,
  Mentions,
  SmartMessage,
  User,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ExampleDMHandlers {
  @Command('dm')
  async onDMDemo(
    @Args() args: Nezon.Args,
    @AutoContext('message') managedMessage: Nezon.AutoContextType.Message,
    @AutoContext('dm') dm: Nezon.AutoContextType.DM,
    @Mentions() mentions?: Nezon.Mentions,
    @Client() client?: Nezon.Client,
  ) {
    const channel = await client?.channels.fetch(managedMessage?.channelId);
    const user = await client?.users.fetch(managedMessage?.senderId);

    const targetInput = args[0];
    if (!targetInput) {
      await managedMessage.reply(
        SmartMessage.text(
          'Sử dụng: *dm <user_id> hoặc *dm @username\n\nHoặc dùng *senddm để gửi DM cho người gửi tin nhắn này.',
        ),
      );
      return;
    }

    try {
      await dm.send(
        mentions[0].user_id,
        SmartMessage.text('Đây là tin nhắn DM được gửi từ bot!'),
      );
      await managedMessage.reply(
        SmartMessage.text(`✅ Đã gửi DM đến user ${mentions[0].user_id}`),
      );
    } catch (error) {
      await managedMessage.reply(
        SmartMessage.text(`❌ Lỗi khi gửi DM: ${(error as Error).message}`),
      );
    }
  }

  @Command('senddm')
  async onSendDMToSender(
    @AutoContext('message') managedMessage: Nezon.AutoContextType.Message,
    @User() user?: Nezon.User,
  ) {
    try {
      await managedMessage.sendDM(
        SmartMessage.text('Đây là tin nhắn DM được gửi tự động cho bạn!'),
      );
      await managedMessage.reply(
        SmartMessage.text(
          `✅ Đã gửi DM đến ${user?.username ?? user?.display_name ?? 'bạn'}`,
        ),
      );
    } catch (error) {
      await managedMessage.reply(
        SmartMessage.text(`❌ Lỗi khi gửi DM: ${(error as Error).message}`),
      );
    }
  }
}
