---
id: overview
title: Giới thiệu Nezon
sidebar_position: 1
slug: /
---

Nezon là thư viện mở rộng NestJS giúp bạn xây dựng bot cho nền tảng **Mezon** nhanh chóng. Thư viện chủ động quản lý vòng đời `MezonClient`, tự động khám phá command/component/event qua decorator và cung cấp hệ decorator tham số typed, giúp bạn tập trung vào logic kinh doanh thay vì wiring chi tiết.

## Tổng quan nhanh

- Khai báo logic bằng decorator: `@Command`, `@Component`, `@On`, `@Once`.
- Truy cập dữ liệu typed qua decorator: `@Message`, `@Channel`, `@User`, ...
- `@AutoContext()` cung cấp helper tuple `[message]` với API tiện dụng (`reply`, `update`, …).
- Namespace `Nezon` đi kèm alias type (`Nezon.Message`, `Nezon.Channel`, ...) nên không cần import trực tiếp từ `mezon-sdk`.
- Event bridge phát toàn bộ sự kiện trong `mezon-sdk` qua `EventEmitter2`.
- Lifecycle service đăng nhập bot, bind listener và dọn dẹp khi ứng dụng shutdown.

---

## 1. Cài đặt & Khởi tạo

```bash
yarn add @n0xgg04/nezon
```

```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NezonModule } from "@n0xgg04/nezon";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? "",
      botId: process.env.MEZON_BOT_ID ?? "",
    }),
  ],
})
export class AppModule {}
```

`NezonModule.forRootAsync` hỗ trợ lấy cấu hình từ service khác nếu cần.

---

## 2. Command văn bản

```ts
import { Injectable } from "@nestjs/common";
import {
  Command,
  Args,
  AutoContext,
  MessageContent,
  SmartMessage,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class PingHandler {
  @Command({ name: "ping", aliases: ["pong"], prefix: "!" })
  async onPing(
    @Args() args: Nezon.Args,
    @AutoContext() [message]: Nezon.AutoContext,
    @MessageContent() content?: string
  ) {
    const reply = args.length ? args.join(" ") : "pong";
    await message.reply(SmartMessage.text(`✅ ${reply} (${content})`));
  }
}
```

`Nezon.Args` là alias của `string[]`, `Nezon.AutoContext` trả về `[ManagedMessage]` với helper `reply`, `update`, `delete`. `SmartMessage` giúp dựng payload gửi tin nhắn mà không cần thao tác trực tiếp với `ChannelMessageContent`.

---

### SmartMessage builder

`SmartMessage` đi kèm các helper phổ biến:

- `Nezon.SmartMessage.text(content)` – tin nhắn text đơn giản.
- `Nezon.SmartMessage.system(content)` – đánh dấu toàn bộ nội dung dạng markdown triple (`EMarkdownType.TRIPLE`).
- `Nezon.SmartMessage.image(url, { alt, filename })` – đính kèm ảnh, optional alt text.
- `Nezon.SmartMessage.voice(url, { transcript })` – gửi audio kèm transcript.

Các builder này trả về object có thể truyền trực tiếp vào `message.reply(...)` thông qua `@AutoContext`.

---

## 3. Component tương tác

```ts
import { Injectable } from "@nestjs/common";
import {
  Command,
  AutoContext,
  Component,
  ComponentPayload,
  ComponentTarget,
  Client,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";
import { EButtonMessageStyle, EMessageComponentType } from "mezon-sdk";

@Injectable()
export class ButtonHandler {
  @Command("button")
  async askForConfirm(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply({
      t: "Nhấn nút để xác nhận.",
      components: [
        {
          components: [
            {
              id: `demo_button_success_${message.id}`,
              type: EMessageComponentType.BUTTON,
              component: {
                label: "Confirm",
                style: EButtonMessageStyle.SUCCESS,
              },
            },
          ],
        },
      ],
    });
  }

  @Component({ pattern: "^demo_button_success_.+" })
  async onConfirm(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @Client() client: Nezon.Client,
    @ComponentTarget() target?: Nezon.Message
  ) {
    const message =
      target ??
      (await client.channels
        .fetch(payload.channel_id)
        .then((channel) => channel.messages.fetch(payload.message_id)));

    await message.reply({ t: `Đã xác nhận, user ${payload.user_id}` });
  }
}
```

`ComponentTarget` dùng cache tích hợp để trả về `Message` gốc, hạn chế fetch lặp lại.

---

## 4. Lắng nghe sự kiện realtime

```ts
import { Injectable } from "@nestjs/common";
import {
  On,
  Once,
  ChannelMessagePayload,
  MessageContent,
  Channel,
  User,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";
import { Events } from "mezon-sdk";

@Injectable()
export class EventListener {
  @On(Events.ChannelMessage)
  async onMessage(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @MessageContent() content: string,
    @Channel() channel: Nezon.Channel | undefined,
    @User() user: Nezon.User | undefined
  ) {
    const author =
      user?.username ?? payload.username ?? payload.sender_id ?? "unknown";
    console.log(`[${channel?.id ?? payload.channel_id}] ${author}: ${content}`);
  }

  @Once("Ready")
  onReady() {
    console.log("Bot is ready");
  }
}
```

### Event bridge

Nezon phát toàn bộ sự kiện trên `mezon-sdk` qua `EventEmitter2`. Bạn có thể inject `EventEmitter2` và lắng nghe tùy ý:

```ts
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Events } from "mezon-sdk";

@Injectable()
export class TokenWatcher {
  constructor(emitter: EventEmitter2) {
    emitter.on(Events.TokenSend, (payload) => {
      console.log("Token transfer", payload);
    });
  }
}
```

Một số sự kiện hay dùng: `Events.ChannelMessage`, `Events.MessageButtonClicked`, `Events.TokenSend`, `Events.AddClanUser`...

---

## 5. Bộ decorator tham số

Namespace `Nezon` cung cấp alias type:

```ts
export namespace Nezon {
  export type Client = MezonClient;
  export type ChannelMessage = ChannelMessage;
  export type Message = MezonMessage;
  export type Channel = MezonTextChannel;
  export type Clan = MezonClan;
  export type User = MezonUser;
  export type ComponentPayload = MessageButtonClicked;
  export type ComponentParams = string[];
  export type ComponentParam = string | undefined;
  export type Args = string[];
}
```

| Decorator                                  | Type / Giá trị                           |
| ------------------------------------------ | ---------------------------------------- |
| `@Context()`                               | Context command/component                |
| `@Args()` / `@Arg(i)`                      | `Nezon.Args` / phần tử `string`          |
| `@Message()`                               | `Nezon.Message`                          |
| `@ChannelMessagePayload()`                 | `Nezon.ChannelMessage`                   |
| `@MessageContent()`                        | Chuỗi nội dung ban đầu                   |
| `@Client()`                                | `Nezon.Client` (`MezonClient`)           |
| `@Channel()` / `@Clan()`                   | `Nezon.Channel`, `Nezon.Clan`            |
| `@User()`                                  | `Nezon.User`                             |
| `@AutoContext()`                           | `Nezon.AutoContext` (`[ManagedMessage]`) |
| `@ComponentPayload()`                      | `Nezon.ComponentPayload`                 |
| `@ComponentParams()` / `@ComponentParam()` | `Nezon.ComponentParams` / phần tử        |
| `@ComponentTarget()`                       | `Nezon.Message` (tin nhắn gốc)           |

### Ví dụ kết hợp

```ts
import { Command, Message, Channel, Args, User } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('greet')
async greet(
  @User() user: Nezon.User,
  @Channel() channel: Nezon.Channel,
  @Args() args: Nezon.Args,
) {
  const name = args.at(0) ?? user.username;
  await channel.send({ t: `Xin chào ${name}` });
}
```

---

## 6. Lifecycle & caching

- `NezonLifecycleService` gọi `login()` khi app bootstrap và dọn dẹp khi shutdown.
- `NezonClientService` giữ một instance `MezonClient` duy nhất.
- `NezonCommandService` & `NezonComponentService` cache channel, clan, user, message theo từng lần xử lý nhằm giảm số lần gọi API.

---

## 7. Demo mẫu

Trong repo đã có app mẫu `apps/mebot`:

```bash
cd apps/mebot
yarn install
yarn start
```

Thiết lập `MEZON_TOKEN` và `MEZON_BOT_ID` trước khi chạy bot.

---

## 8. Góp ý & phát triển

- Mở issue/PR nếu bạn cần thêm decorator hoặc hỗ trợ component mới.
- Theo dõi thay đổi của `mezon-sdk` để cập nhật alias type khi cần.
- Chia sẻ trải nghiệm, mẹo sử dụng để thư viện ngày càng tốt hơn.
