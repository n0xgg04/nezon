import { Injectable } from "@nestjs/common";
import { AutoContext, Command, Mentions, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class ExampleMentionHandlers {
  @Command("mention-demo")
  async mentionDemo(
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @Mentions(0) firstMention?: Nezon.Mention
  ) {
    if (!firstMention?.user_id) {
      await managedMessage.reply(
        SmartMessage.text(
          "Hãy mention 1 người bạn để bot chào họ bằng placeholder nhé!"
        )
      );
      return;
    }

    await managedMessage.reply(
      SmartMessage.text("Bot gửi lời chào tới {{target_user}}  👋").addMention({
        target_user: firstMention.user_id,
      })
    );
  }

  @Command("multi-mention")
  async multiMention(
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @Mentions() mentions: Nezon.Mentions
  ) {
    if (!mentions.length) {
      await managedMessage.reply(
        SmartMessage.text(
          "Hãy mention vài người bạn rồi thử lại `*multi-mention` nhé!"
        )
      );
      return;
    }

    const placeholderMap = mentions.reduce<Record<string, string>>(
      (acc, mention, index) => {
        const userId = mention.user_id;
        if (userId) {
          acc[`user_${index + 1}`] = userId;
        }
        return acc;
      },
      {}
    );

    if (!Object.keys(placeholderMap).length) {
      await managedMessage.reply(
        SmartMessage.text("Không tìm thấy user_id trong danh sách mentions.")
      );
      return;
    }

    const sentence = Object.keys(placeholderMap)
      .map((key) => `{{${key}}}`)
      .join(", ");

    await managedMessage.reply(
      SmartMessage.text(`Xin chào ${sentence}!`).addMention(placeholderMap)
    );
  }
}
