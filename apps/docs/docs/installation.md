---
id: installation
title: Installation
sidebar_position: 2
---

Hướng dẫn cài đặt Nezon và tạo bot đầu tiên với tính năng ping-pong.

## Yêu cầu

- Node.js >= 18
- Mezon bot token và bot ID

> **Lấy bot token và bot ID:** Tạo bot mới tại [https://mezon.ai/developers/applications](https://mezon.ai/developers/applications)

## Cài đặt & Quick Example

Nếu bạn muốn thử nhanh trong project sẵn có:

1. Cài đặt package:

   ```bash
   yarn add @n0xgg04/nezon
   # hoặc npm install @n0xgg04/nezon
   ```

2. Khai báo module:

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

3. Tạo handler cơ bản:

   ```ts
   @Injectable()
   export class PingHandler {
     @Command("ping")
     async onPing(@AutoContext() [message]: Nezon.AutoContext) {
       await message.reply(Nezon.SmartMessage.text("pong!"));
     }
   }
   ```

4. Thêm `PingHandler` vào `providers` của module, chạy `yarn start:dev`, gõ `*ping` trong Mezon.

---

Ngoài ra bạn có thể chọn một trong hai cách bên dưới:

### Cách 1: Tạo project mới (Khuyến nghị) ⭐

Sử dụng `create-mezon-bot` để tạo project với template sẵn:

```bash
npx create-mezon-bot my-bot
```

Hoặc:

```bash
npm create mezon-bot my-bot
```

Lệnh này sẽ tự động:

- ✅ Tạo cấu trúc project NestJS hoàn chỉnh
- ✅ Cài đặt tất cả dependencies (`@n0xgg04/nezon`, `@nestjs/*`, etc.)
- ✅ Tạo example handlers với các tính năng demo
- ✅ Cấu hình `NezonModule` sẵn sàng
- ✅ Tạo `.env.example` với template

Sau đó:

```bash
cd my-bot
cp .env.example .env
```

Chỉnh sửa `.env` và thêm credentials:

```env
MEZON_TOKEN=your_mezon_token_here
MEZON_BOT_ID=your_bot_id_here
```

Chạy bot:

```bash
yarn start:dev
```

Bot sẽ tự động kết nối và sẵn sàng nhận commands!

### Cách 2: Cài đặt vào project hiện có

Nếu bạn đã có NestJS project:

#### 1. Cài đặt package

```bash
yarn add @n0xgg04/nezon
```

hoặc với npm:

```bash
npm install @n0xgg04/nezon
```

Đảm bảo đã cài `mezon-sdk` (được khai báo trong peer dependency).

#### 2. Cấu hình Module

Tạo hoặc cập nhật `app.module.ts`:

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

#### 3. Cấu hình môi trường

Tạo file `.env`:

```env
MEZON_TOKEN=your_bot_token_here
MEZON_BOT_ID=your_bot_id_here
```

#### 4. Tạo Handler

Tạo file `ping.handler.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { Command, AutoContext, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class PingHandler {
  @Command({ name: "ping", aliases: ["pong"] })
  async onPing(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    await managedMessage.reply(SmartMessage.text("pong!"));
  }
}
```

#### 5. Đăng ký Handler

Thêm handler vào `app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NezonModule } from "@n0xgg04/nezon";
import { PingHandler } from "./ping.handler";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? "",
      botId: process.env.MEZON_BOT_ID ?? "",
    }),
  ],
  providers: [PingHandler],
})
export class AppModule {}
```

## Chạy Bot

```bash
yarn start:dev
```

hoặc

```bash
npm run start:dev
```

## Test Bot

Trong Mezon, gửi tin nhắn:

```
*ping
```

hoặc

```
*pong
```

Bot sẽ phản hồi: `pong!`

### Nếu bạn dùng create-mezon-bot

Project được tạo đã có sẵn nhiều example commands để bạn tham khảo:

- `*ping` / `*pong` - Ping pong command
- `*button` - Demo button với setCustomId
- `*onclick` - Demo button với onClick handler
- `*image` - Demo image attachments
- `*embed` - Demo embed messages
- `*form` - Demo form với text fields và select fields
- `*file` - Demo file attachments
- `*update` - Demo message update với buttons
- `*slots` - Demo animated embed (slot machine) với `addAnimatedImage`

Xem thư mục `src/bot/examples/` (ví dụ `example-command.handlers.ts`, `example-embed.handlers.ts`, ...) để học cách sử dụng các tính năng của Nezon.

## Giải thích Code

### `@Command` Decorator

```ts
@Command({ name: 'ping', aliases: ['pong'] })
```

- `name`: Tên command chính (mặc định prefix `*`)
- `aliases`: Các tên thay thế cho command
- Có thể dùng string ngắn: `@Command('ping')`

### `@AutoContext` Decorator

```ts
@AutoContext() [message]: Nezon.AutoContext
```

- **Không có key**: Trả về tuple `[ManagedMessage, DMHelper, ChannelHelper]`
- **Với key `'message'`**: Trả về `ManagedMessage` (type: `Nezon.AutoContextType.Message`)
- **Với key `'dm'`**: Trả về `DMHelper` (type: `Nezon.AutoContextType.DM`)
- **Với key `'channel'`**: Trả về `ChannelHelper` (type: `Nezon.AutoContextType.Channel`)
- `ManagedMessage` có các methods: `reply()`, `update()`, `delete()`, `sendDM()`
- `DMHelper` có method: `send(userId, message)` để gửi DM
- `ChannelHelper` có `.send()` để post message mới vào channel hiện tại và `.find(channelId)` để bind sang channel khác

**Ví dụ 1: Lấy toàn bộ tuple (backward compatible)**

```ts
@Command('ping')
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

**Ví dụ 2: Lấy phần tử cụ thể bằng key**

```ts
@Command('dm')
async onDM(
  @Args() args: Nezon.Args,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
  @AutoContext('dm') dm: Nezon.AutoContextType.DM,
) {
  const userId = args[0];
  await dm.send(userId, SmartMessage.text('Hello via DM!'));
}

@Command('broadcast')
async onBroadcast(
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  if (!channel) return;
  await channel.send(SmartMessage.text('Thông báo trong channel hiện tại!'));
}

@Command('broadcast-to')
async onBroadcastTo(
  @Args() args: Nezon.Args,
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  const [channelId] = args;
  if (!channel || !channelId) {
    await channel?.send(
      SmartMessage.text('Sử dụng: *broadcast-to <channel_id>'),
    );
    return;
  }
  await channel
    .find(channelId)
    .send(SmartMessage.text(`Gửi thông báo tới channel ${channelId}`));
}

> **Lưu ý**: Trong event handlers (`@On`, `@Once`), `channel` có thể là `null` vì không có channel context cố định.
```

### `SmartMessage.text()`

```ts
SmartMessage.text("pong!");
```

- Tạo message text đơn giản
- Trả về object có thể truyền vào `message.reply()`
- Tương đương với `{ text: 'pong!' }`

## Ví dụ nâng cao

### Command với arguments

```ts
@Command('greet')
async onGreet(
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const name = args[0] ?? 'Anonymous';
  await message.reply(SmartMessage.text(`Hello, ${name}!`));
}
```

Sử dụng: `*greet John` → Bot reply: `Hello, John!`

### Command với prefix tùy chỉnh

```ts
@Command({ name: 'ping', prefix: '!' })
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

Sử dụng: `!ping` (thay vì `*ping`)

### Command với MessageContent

```ts
@Command('echo')
async onEcho(
  @MessageContent() content: string | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const text = content?.replace('*echo', '').trim() ?? 'Nothing to echo';
  await message.reply(SmartMessage.text(text));
}
```

Sử dụng: `*echo Hello World` → Bot reply: `Hello World`

## Tạo project với create-mezon-bot

`create-mezon-bot` là công cụ CLI giúp tạo project Mezon bot với Nezon một cách nhanh chóng. Project được tạo sẽ bao gồm:

- ✅ Cấu trúc NestJS hoàn chỉnh
- ✅ NezonModule đã được cấu hình
- ✅ Example handlers với các tính năng demo
- ✅ TypeScript configuration
- ✅ Tất cả dependencies cần thiết

### Sử dụng

```bash
npx create-mezon-bot my-bot
```

Sau khi tạo project, bạn sẽ có:

- `src/bot/examples/` - Bộ example handlers được chia theo module (`example-command`, `example-embed`, ...)
- `.env.example` - Template cho environment variables
- `package.json` - Đã có sẵn tất cả dependencies

### Example commands có sẵn

Project được tạo sẽ có sẵn các example commands:

- `*ping` / `*pong` - Ping pong command
- `*button` - Demo button với setCustomId
- `*onclick` - Demo button với onClick handler
- `*image` - Demo image attachments
- `*embed` - Demo embed messages
- `*form` - Demo form với text fields và select fields
- `*file` - Demo file attachments
- `*update` - Demo message update với buttons

Xem thêm: [create-mezon-bot trên npm](https://www.npmjs.com/package/create-mezon-bot)

## Troubleshooting

- **Bot không phản hồi:** kiểm tra token/ID, đảm bảo bot đã join clan và xem log console.
- **Module không được load:** chắc chắn handler có `@Injectable()` và được thêm vào `providers`.
- **Type errors:** import type từ `@n0xgg04/nezon` và dùng namespace `Nezon` (ví dụ `Nezon.AutoContext`).

## Next Steps

1. [Lấy thông tin](./guides/data-access.md) – đọc message, channel, clan, form data...
2. [Xử lý logic & event](./guides/logic-events.md) – command, component, onClick, @On/@Once.
3. [Message Builder](./message-template/overview.md) – xây dựng nội dung (text, embed, form...).
4. [Gửi tin nhắn](./messaging/send-message.md) – reply, channel helper, DM helper, client thuần.
5. [Utility Service](./nezon/utils.md) – `NezonUtilsService`.
6. [Examples](./examples.md) – danh sách tính năng đã có sẵn trong example bot.
7. [Decorators](./decorators.md) – tra cứu đầy đủ decorator.
