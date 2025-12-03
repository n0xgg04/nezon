---
title: Xử Lý Logic & Event
sidebar_position: 4
description: Hướng dẫn xây dựng command, component, onClick và lắng nghe sự kiện bằng @On/@Once.
---

# Xử Lý Logic & Điều Kiện

Tài liệu này tổng hợp cách xử lý luồng nghiệp vụ trong Nezon. Mỗi mục đều dẫn link tới trang chi tiết để bạn đào sâu hơn.

## 1. Command – lệnh văn bản

Sử dụng `@Command()` để tạo lệnh dạng `*ping`, `*poll`...

```ts
import { Command, AutoContext, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Command({ name: "ping", aliases: ["pong"] })
export class PingCommand {
  async execute(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(SmartMessage.text("pong!"));
  }
}
```

- Hỗ trợ `@Args()` để lấy tham số.
- Có thể tổ chức thành nhiều handler module (xem `apps/mebot`).

👉 Chi tiết: [Tương tác → Command](../interaction/command.md).

## 2. Component – xử lý button/dropdown

Dùng `@Component()` với `pattern` khớp `ButtonBuilder.setCustomId`. Bạn có thể inject:

- `@ComponentParams()` / `@ComponentParams('id')`
- `@ComponentPayload()` – raw payload
- `@FormData()` – dữ liệu form kèm theo
- `@AutoContext()` – reply/update message

```ts
@Component({ pattern: '/poll/create' })
async onPollCreate(
  @FormData() form: Nezon.FormData | undefined,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(
    SmartMessage.text(
      `Form Data:\n${JSON.stringify(form, null, 2)}`,
    ),
  );
}
```

👉 Chi tiết: [Tương tác → Component](../interaction/component.md).

## 3. Button onClick

Không muốn tạo `@Component` riêng? Bạn có thể gắn handler inline khi build button.

```ts
new ButtonBuilder()
  .setLabel("Vote")
  .setStyle(ButtonStyle.Success)
  .onClick(async ({ message, user, formData }) => {
    await message.reply(
      SmartMessage.text(
        `User ${user?.username} chọn: ${formData?.option ?? "N/A"}`
      )
    );
  });
```

Context được chuẩn hóa:

- `message`: ManagedMessage
- `channel`: TextChannel
- `user`: User
- `clan`: Clan
- `client`: MezonClient
- `formData`: Record các input (nếu embed có form)

👉 Chi tiết: [Tương tác → onClick](../interaction/onclick.md).

## 4. Event-driven với @On / @Once

Nezon re-export toàn bộ `Nezon.Events` từ `mezon-sdk`.  
`@On` lắng nghe liên tục, `@Once` chỉ chạy một lần đầu tiên.

```ts
import { On, Once, AutoContext, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

export class EventHandlers {
  @On(Nezon.Events.ChannelMessage)
  async logMessage(
    @AutoContext("message") message: Nezon.AutoContextType.Message
  ) {
    await message.reply(SmartMessage.text("Bot đã thấy tin nhắn của bạn!"));
  }

  @Once(Nezon.Events.BotReady)
  onReady() {
    console.log("Bot ready!");
  }
}
```

- **Decorator hỗ trợ trong handler @On/@Once**:

  - `@ChannelMessagePayload()` / `@EventPayload()` – lấy raw payload từ Mezon
  - `@MessageContent()` – lấy nội dung text của message (nếu event là `ChannelMessage`)
  - `@Channel()` / `@Channel('name')` – lấy channel entity hoặc field cụ thể
  - `@Clan()` – lấy clan entity
  - `@User()` / `@User('username')` – lấy user entity hoặc field cụ thể
  - `@Attachments()` / `@Mentions()` – đọc files và mentions từ payload
  - `@Client()` – lấy `MezonClient` instance hiện tại
  - `@AutoContext()` – hiện tại chỉ support **DM helper** trong bối cảnh event (`[null, dmHelper, null]`)
  - `@NezonUtils()` – inject `NezonUtilsService` để dùng helper (getClan, getChannel, v.v.)

- Danh sách sự kiện: [Events List](../events-list.md)
- Hướng dẫn chi tiết: [Tương tác → Events](../interaction/events.md)

### 4.1 @OnMention – khi bot được mention

`@OnMention()` là shortcut cho việc lắng nghe riêng case **bot bị mention** trong channel:

- Source event là `Nezon.Events.ChannelMessage`
- Nezon sẽ tự kiểm tra `message.mentions` có chứa `user_id === botId` (lấy từ `NezonModule.forRoot({ botId })`)
- Chỉ khi có mention bot, handler `@OnMention()` mới được gọi

```ts
import {
  OnMention,
  MessageContent,
  Channel,
  User,
  AutoContext,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

export class MentionHandlers {
  @OnMention()
  async onBotMention(
    @MessageContent() content: string,
    @Channel() channel: Nezon.Channel | undefined,
    @User() user: Nezon.User | undefined,
    @AutoContext("dm") dm: Nezon.AutoContextType.DM
  ) {
    if (!user) return;
    await dm.send(
      user.id,
      Nezon.SmartMessage.text(
        `Bạn vừa mention bot trong kênh ${
          channel?.name ?? "unknown"
        } với nội dung: ${content}`
      )
    );
  }
}
```

> Lưu ý: `@OnMention()` vẫn dùng chung toàn bộ hệ thống decorator param như `@On()` / `@Once()`, nên bạn có thể mix thêm `@Mentions()`, `@Attachments()`, `@Client()`, `@NezonUtils()`, ...

## 5. So sánh nhanh

| Nhu cầu                               | Gợi ý                                     |
| ------------------------------------- | ----------------------------------------- |
| Người dùng gõ lệnh `*`                | `@Command`                                |
| Người dùng bấm button/dropdown        | `@Component` hoặc `ButtonBuilder.onClick` |
| Xử lý form embed                      | `@FormData` (component/onClick)           |
| Lắng nghe hệ thống (join/leave/token) | `@On`, `@Once` với `Nezon.Events.*`       |

Sau khi xử lý logic, chuyển sang:

- [Message Builder](../message-template/overview.md) để dựng nội dung phản hồi.
- [Gửi tin nhắn](../messaging/send-message.md) để biết cách reply DM, gửi vào channel khác hoặc dùng Mezon SDK thuần.
