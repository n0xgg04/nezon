import { Injectable } from "@nestjs/common";
import {
  Args,
  Attachments,
  AutoContext,
  Command,
  Mentions,
  MessageContent,
  SmartMessage,
  User,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class ExampleCommandHandlers {
  @Command({ name: "ping", aliases: ["pong"] })
  async onPing(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
  ) {
    const suffix = args.length ? args.join(" ") : "pong";
    await managedMessage.reply(SmartMessage.system(suffix));
  }

  @Command("file")
  async onFileDemo(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.text("Here is a file attachment!").addFile(
        "https://cdn.mezon.ai/1779484504377790464/1840658523503988736/1838769001518338000/1762397837280_apps.apple.com_main.zip",
        "apps.apple.com-main.zip",
        "application/x-zip-compressed",
        { size: 3215230 },
      ),
    );
  }

  @Command("prompt")
  async onPrompt(
    @Args() args: Nezon.Args,
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @User() user?: Nezon.User,
    @MessageContent() content?: string,
  ) {
    const userText = args.length ? args.join(" ") : "";
    const userId = user?.id ?? "unknown";
    await managedMessage.reply(
      SmartMessage.text(`User ID: ${userId}\nTin nhắn: ${content ?? userText}`),
    );
  }

  @Command("inspect")
  async onInspect(
    @Attachments() attachments: Nezon.Attachments,
    @Attachments(0) firstAttachment: Nezon.Attachment | undefined,
    @Mentions() mentions: Nezon.Mentions,
    @Mentions(0) firstMention: Nezon.Mention | undefined,
    @AutoContext("message") managedMessage: Nezon.AutoContextType.Message,
  ) {
    const attachmentLines = attachments.length
      ? attachments
          .map((file, index) => {
            const label = file.filename ?? file.url ?? "unknown";
            return `${index + 1}. ${label}`;
          })
          .join("\n")
      : "Không có file đính kèm";
    const mentionLabels = mentions.length
      ? mentions
          .map((item) => item.username ?? item.user_id ?? "unknown")
          .join(", ")
      : "Không có mention";
    const summary = [
      `Tổng số file: ${attachments.length}`,
      `File đầu tiên: ${firstAttachment?.filename ?? firstAttachment?.url ?? "không có"}`,
      `Tổng số mention: ${mentions.length}`,
      `Mention đầu tiên: ${firstMention?.username ?? firstMention?.user_id ?? "không có"}`,
      "",
      "Danh sách file:",
      attachmentLines,
      "",
      `Mentions: ${mentionLabels}`,
    ].join("\n");
    await managedMessage.reply(SmartMessage.text(summary));
  }

  @Command("channel-demo")
  async onChannelDemo(
    @AutoContext("channel") channel: Nezon.AutoContextType.Channel,
  ) {
    if (!channel) {
      return;
    }
    await channel.send(
      SmartMessage.text(
        "Tin nhắn này được gửi trực tiếp vào channel hiện tại!",
      ),
    );
  }

  @Command("channel-to")
  async onChannelTo(
    @Args() args: Nezon.Args,
    @AutoContext("channel") channel: Nezon.AutoContextType.Channel,
  ) {
    if (!channel) {
      return;
    }
    const [targetChannelId] = args;
    if (!targetChannelId) {
      await channel.send(
        SmartMessage.text(
          "Sử dụng: *channel-to <channel_id> để gửi tới channel khác",
        ),
      );
      return;
    }
    await channel
      .find(targetChannelId)
      .send(
        SmartMessage.text(
          `Xin chào channel ${targetChannelId}! Đây là tin nhắn được gửi bằng ChannelHelper.`,
        ),
      );
  }
}
