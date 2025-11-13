id: overview
title: Giới thiệu Nezon
sidebar_position: 1
slug: /

---

Nezon là thư viện mở rộng NestJS giúp bạn xây dựng bot cho nền tảng **Mezon** nhanh chóng, an toàn và giàu tính năng. Thay vì tự tay kết nối `MezonClient`, khai báo vô số listener và tự fetch dữ liệu cho từng sự kiện, Nezon tự động hóa toàn bộ quy trình:

- **Decorator cấp cao** (`@Command`, `@Component`, `@On`, `@Once`) cho phép khai báo logic một cách trực quan.
- **Hệ decorator tham số typed** (`@Args`, `@Channel`, `@NezonMessage`, `@NezonUser`, …) trả về đúng kiểu dữ liệu từ `mezon-sdk`.
- **`@ComponentTarget`** và cơ chế cache, giúp truy cập nhanh tin nhắn gốc của component mà không phải fetch lặp lại.
- **Event bridge tích hợp**: mọi sự kiện trong `mezon-sdk` được bind và phát qua `EventEmitter2`, bạn chỉ cần subscribe.
- **Lifecycle service** đăng nhập bot, bind/unbind listener và đóng kết nối khi ứng dụng kết thúc.

---

## 1. Cài đặt & Khởi tạo

### Cài đặt

```bash
yarn add @n0xgg04/nezon
```

> **Lưu ý:** `mezon-sdk` là peer dependency, hãy cài đặt cùng phiên bản với bot hiện tại.

### Khởi tạo module

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

`NezonModuleOptions` thừa hưởng toàn bộ thuộc tính của `ClientConfigDto`. Nếu muốn lấy cấu hình từ service khác, hãy dùng `NezonModule.forRootAsync`.

---

## 2. Viết command văn bản

### Interface `NezonCommandOptions`

```ts
export interface NezonCommandOptions {
  name: string;
  aliases?: string[];
  prefix?: string; // mặc định '*'
}
```

### Ví dụ

```ts
import { Injectable } from "@nestjs/common";
import { Command, Args, MessageContent, NezonMessage } from "@n0xgg04/nezon";
import { Message as MezonMessage } from "mezon-sdk/dist/cjs/mezon-client/structures/Message";

@Injectable()
export class PingHandler {
  @Command({ name: "ping", aliases: ["pong"], prefix: "!" })
  async onPing(
    @Args() args: string[],
    @MessageContent() content: string,
    @NezonMessage() message?: MezonMessage
  ) {
    if (!message) return;
    const reply = args.length ? args.join(" ") : "pong";
    await message.reply({ t: `✅ ${reply} (${content})` });
  }
}
```

Nezon tự động parse `ChannelMessage`, xử lý prefix, tên command và tham số rồi dựng `NezonCommandContext` để inject dữ liệu.

---

## 3. Xử lý component tương tác

### Interface `NezonComponentOptions`

```ts
export interface NezonComponentOptions {
  id?: string;
  pattern?: RegExp | string;
  event?: Events | string; // mặc định Events.MessageButtonClicked
  separator?: string | RegExp; // mặc định '_'
}
```

### Ví dụ với `@ComponentTarget`

```ts
import { Injectable } from "@nestjs/common";
import {
  Command,
  Component,
  ComponentPayload,
  ComponentTarget,
  Client,
  NezonMessage,
} from "@n0xgg04/nezon";
import {
  EButtonMessageStyle,
  EMessageComponentType,
  MezonClient,
} from "mezon-sdk";
import { Message as MezonMessage } from "mezon-sdk/dist/cjs/mezon-client/structures/Message";
import { MessageButtonClicked } from "mezon-sdk/dist/cjs/rtapi/realtime";

@Injectable()
export class ButtonHandler {
  @Command("button")
  async askForConfirm(@NezonMessage() message?: MezonMessage) {
    if (!message) return;
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
    @ComponentPayload() payload: MessageButtonClicked,
    @Client() client: MezonClient,
    @ComponentTarget() target?: MezonMessage
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

`@ComponentTarget` sử dụng cache nội bộ để lấy `Message` gốc của component. Nếu cache không tồn tại, Nezon sẽ fetch và lưu lại cho lần sau.

---

## 4. Lắng nghe sự kiện realtime

### Decorator `@On` / `@Once`

```ts
import { Injectable } from "@nestjs/common";
import { On, Once, ChannelMessagePayload } from "@n0xgg04/nezon";
import { ChannelMessage } from "mezon-sdk";

@Injectable()
export class EventListener {
  @On("ChannelMessage")
  async onMessage(@ChannelMessagePayload() message: ChannelMessage) {
    if (message.sender_id === message.bot_id) return;
    console.log("Received message", message.content.t);
  }

  @Once("Ready")
  onReady() {
    console.log("Bot is ready");
  }
}
```

### Event bridge & EventEmitter2

`NezonEventBridgeService` đăng ký **tất cả giá trị trong `mezon-sdk/dist/constants/Events`** và phát lại qua `EventEmitter2`. Bạn có thể inject `EventEmitter2` để subscribe tùy ý:

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

Một vài sự kiện thường dùng:

| `Events`                      | Ý nghĩa                                 |
| ----------------------------- | --------------------------------------- |
| `Events.ChannelMessage`       | Tin nhắn mới trong channel/thread       |
| `Events.MessageButtonClicked` | Người dùng click button trong component |
| `Events.TokenSend`            | Giao dịch token giữa người dùng         |
| `Events.AddClanUser`          | Thành viên mới vào clan                 |
| `Events.GiveCoffee`           | Hành động tặng coffee                   |
| `Events.StreamingJoinedEvent` | Người dùng tham gia phòng stream/voice  |

> Nezon chuẩn hoá một số payload (ví dụ `ChannelMessage`) để luôn có mảng `mentions`, `attachments`, `references`.

---

## 5. Bộ decorator tham số

### Enum `NezonParamType`

```ts
export enum NezonParamType {
  CONTEXT = "context",
  MESSAGE = "message",
  CLIENT = "client",
  ARGS = "args",
  ARG = "arg",
  COMPONENT = "component",
  COMPONENT_PARAMS = "component_params",
  COMPONENT_PARAM = "component_param",
  MESSAGE_CONTENT = "message_content",
  CHANNEL = "channel",
  CLAN = "clan",
  USER = "user",
  THIS_MESSAGE = "this_message",
  COMPONENT_TARGET = "component_target",
}
```

### Tra cứu nhanh

| Decorator                                      | Giá trị trả về                                           |
| ---------------------------------------------- | -------------------------------------------------------- |
| `@Context()`                                   | Toàn bộ context (command/component)                      |
| `@Args()` / `@Arg(index)`                      | Mảng tham số text và từng phần tử cụ thể                 |
| `@ChannelMessagePayload()` / `@NezonMessage()` | Tin nhắn hiện tại ở dạng `ChannelMessage` hoặc `Message` |
| `@MessageContent()`                            | Chuỗi nội dung tin nhắn (`content.t`)                    |
| `@Client()`                                    | Instance `MezonClient` đang được dùng                    |
| `@Channel()` / `@Clan()`                       | Channel/Clan tương ứng đã được cache                     |
| `@NezonUser()`                                 | User gửi tin nhắn (fetch từ clan cache)                  |
| `@ComponentPayload()`                          | Payload nguyên gốc của component                         |
| `@ComponentParams()` / `@ComponentParam(i)`    | Mảng tham số tách từ `button_id` và phần tử theo vị trí  |
| `@ComponentTarget()`                           | `Message` gốc mà component thuộc về (có cache tự động)   |

### Ví dụ tổng hợp

```ts
import { Command, NezonUser, Channel, Args } from '@n0xgg04/nezon';
import { User as MezonUser } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';

@Command('greet')
async greet(@NezonUser() user: MezonUser, @Channel() channel: TextChannel, @Args() args: string[]) {
  const name = args.at(0) ?? user.username;
  await channel.send({ t: `Xin chào ${name}` });
}
```

---

## 6. Lifecycle & caching

- `NezonLifecycleService` gọi `login()` trên `MezonClient`, khởi tạo command/component/event bridge và hủy đăng ký khi app dừng.
- `NezonClientService` giữ một instance `MezonClient` singleton. Bạn có thể inject service này để gọi API tùy ý.
- `NezonCommandService` và `NezonComponentService` cache channel, clan, user, message theo từng request nhằm giảm số lần `fetch`.

---

## 7. Demo mẫu

Kho chứa kèm ứng dụng mẫu tại `apps/mebot`. Chạy thử:

```bash
cd apps/mebot
yarn install
yarn start
```

Thiết lập `MEZON_TOKEN` và `MEZON_BOT_ID` trong biến môi trường trước khi khởi động bot.

---

## 8. Góp ý & phát triển

- Mở issue/PR tại GitHub nếu bạn cần thêm decorator hoặc hỗ trợ component mới.
- Lên lịch kiểm tra phiên bản `mezon-sdk` khi Mezon phát hành cập nhật mới.
- Chia sẻ trải nghiệm hoặc mẹo sử dụng qua cộng đồng để thư viện ngày càng tốt hơn.
