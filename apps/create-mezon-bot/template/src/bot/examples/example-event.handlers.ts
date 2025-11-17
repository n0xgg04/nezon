import { Injectable, Logger } from "@nestjs/common";
import {
  AutoContext,
  Channel,
  ChannelMessagePayload,
  MessageContent,
  On,
  EventPayload,
  SmartMessage,
  User,
} from "@n0xgg04/nezon";
import { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class ExampleEventHandlers {
  private readonly logger = new Logger(ExampleEventHandlers.name);

  @On(Nezon.Events.ChannelMessage)
  async logChannelMessage(
    @ChannelMessagePayload() message: Nezon.ChannelMessage,
    @ChannelMessagePayload("message_id") messageId: string | undefined,
    @MessageContent() content: string,
    @Channel() channel: Nezon.Channel | undefined,
    @Channel("id") channelId: string | undefined,
    @User() user: Nezon.User | undefined,
    @User("avartar") username: string | undefined
  ) {
    const channelLabel =
      channelId ?? channel?.id ?? message.channel_id ?? "unknown";
    const author =
      username ??
      user?.username ??
      message.username ??
      message.display_name ??
      message.sender_id ??
      "unknown";
    this.logger.verbose(
      `message ${messageId ?? message.message_id ?? "unknown"} received from ${author} in channel ${channelLabel}: ${content}`
    );
  }

  @On(Nezon.Events.VoiceJoinedEvent)
  async onVoice(
    @EventPayload() event: Nezon.VoiceJoinedPayload,
    @AutoContext("dm") dm: Nezon.AutoContextType.DM
  ) {
    await dm.send(event.user_id, SmartMessage.text("Đã join"));
  }

  @On(Nezon.Events.TokenSend)
  async onTokenSend(
    @EventPayload() event: Nezon.TokenSendPayload,
    @AutoContext("dm") dm: Nezon.AutoContextType.DM
  ) {
    await dm.send(
      event.sender_id,
      SmartMessage.text(
        `Bạn đã gửi ${event.amount} token đến ${event.transaction_id}`
      )
    );
    this.logger.verbose(`token send received: ${event.amount}`);
  }
}
