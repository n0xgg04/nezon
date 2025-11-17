import { Injectable, Logger } from "@nestjs/common";
import {
  AutoContext,
  ButtonBuilder,
  ButtonStyle,
  ChannelMessagePayload,
  Client,
  Command,
  Component,
  ComponentParams,
  ComponentPayload,
  ComponentTarget,
  FormData,
  SmartMessage,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class ExampleComponentHandlers {
  private readonly logger = new Logger(ExampleComponentHandlers.name);

  @Command("button")
  async onButtonDemo(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @AutoContext() [managedMessage]: Nezon.AutoContext
  ) {
    const referenceId = payload.message_id ?? managedMessage.id ?? "unknown";
    await managedMessage.reply(
      SmartMessage.text("Click the button to confirm.").addButton(
        new ButtonBuilder()
          .setCustomId(`/demo/success/${referenceId}`)
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Success)
      )
    );
  }

  @Command("onclick")
  async onClickDemo(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(
      SmartMessage.text(
        "Click the buttons below to see onClick handlers in action!"
      )
        .addButton(
          new ButtonBuilder()
            .setLabel("Button 1 (onClick)")
            .setStyle(ButtonStyle.Primary)
            .onClick(async (context) => {
              await context.message.reply(
                SmartMessage.text("Button 1 was clicked!")
              );
            })
        )
        .addButton(
          new ButtonBuilder()
            .setLabel("Button 2 (onClick)")
            .setStyle(ButtonStyle.Success)
            .onClick(async ({ channel, user, message }) => {
              await message.reply(
                SmartMessage.text(
                  `Button 2 was clicked by ${user.display_name} in ${channel.name}!`
                )
              );
            })
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId("/demo/success/onclick-static")
            .setLabel("Button 3 (setCustomId)")
            .setStyle(ButtonStyle.Secondary)
        )
    );
  }

  @Command("update")
  async onUpdateDemo(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @AutoContext() [managedMessage]: Nezon.AutoContext
  ) {
    const messageId = payload.message_id ?? managedMessage.id ?? "unknown";
    await managedMessage.reply(
      SmartMessage.text("Chọn một hành động:")
        .addImage("https://picsum.photos/800/600", {
          filename: "example.jpg",
        })
        .addButton(
          new ButtonBuilder()
            .setCustomId(`/update/${messageId}/cancel`)
            .setLabel("Hủy")
            .setStyle(ButtonStyle.Danger)
        )
        .addButton(
          new ButtonBuilder()
            .setCustomId(`/update/${messageId}/success`)
            .setLabel("Thành công")
            .setStyle(ButtonStyle.Success)
        )
    );
  }

  @Component({ pattern: "/update/:message_id/cancel" })
  async onUpdateCancel(
    @ComponentParams("message_id") targetId: string | undefined,
    @AutoContext() [managedMessage]: Nezon.AutoContext
  ) {
    await managedMessage.update(SmartMessage.text("Đã hủy"));
    if (targetId) {
      this.logger.verbose(`update cancel triggered for message ${targetId}`);
    }
  }

  @Component({ pattern: "/update/:message_id/success" })
  async onUpdateSuccess(
    @ComponentParams("message_id") targetId: string | undefined,
    @AutoContext() [managedMessage]: Nezon.AutoContext
  ) {
    await managedMessage.update(SmartMessage.text("Thành công"));
    if (targetId) {
      this.logger.verbose(`update success triggered for message ${targetId}`);
    }
  }

  @Component({ pattern: "/demo/success/:source_id" })
  async onDemoButtonClicked(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @ComponentParams("source_id") sourceId: string | undefined,
    @Client() client: Nezon.Client,
    @ComponentTarget() targetMessage?: Nezon.Message
  ) {
    if (!payload?.channel_id || !payload?.message_id) {
      return;
    }
    try {
      const message =
        targetMessage ?? (await this.getMessageByIds(client, payload));
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
        (error as Error)?.stack
      );
    }
  }

  @Component({ pattern: "/user/:user_id/:action" })
  async onUserAction(
    @AutoContext() [managedMessage]: Nezon.AutoContext,
    @ComponentParams() allParams: Record<string, string> | string[],
    @ComponentParams("user_id") userId: string,
    @ComponentParams("action") action: string
  ) {
    await managedMessage.reply(
      SmartMessage.text(
        `User ID: ${userId}\nAction: ${action}\nAll params: ${JSON.stringify(allParams)}`
      )
    );
  }

  @Component({ pattern: "/quiz/answer/:choice" })
  async onQuizAnswer(
    @ComponentParams("choice") choice: string | undefined,
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @AutoContext() [managedMessage]: Nezon.AutoContext
  ) {
    const answer = choice ?? "unknown";
    await managedMessage.reply(
      SmartMessage.text(
        `Bạn đã chọn đáp án ${answer}\nUser: ${payload.user_id ?? "unknown"}`
      )
    );
  }

  private async getMessageByIds(
    client: Nezon.Client,
    payload: Nezon.ComponentPayload
  ) {
    try {
      const channel = await client.channels.fetch(payload.channel_id);
      return await channel.messages.fetch(payload.message_id);
    } catch {
      return undefined;
    }
  }
}
