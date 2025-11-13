---
id: installation
title: Installation
sidebar_position: 2
---

Hướng dẫn cài đặt Nezon và tạo bot đầu tiên với tính năng ping-pong.

## Yêu cầu

- Node.js >= 18
- Mezon bot token và bot ID

## Cài đặt

Có 2 cách để bắt đầu với Nezon:

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
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NezonModule } from '@n0xgg04/nezon';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? '',
      botId: process.env.MEZON_BOT_ID ?? '',
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
import { Injectable } from '@nestjs/common';
import {
  Command,
  AutoContext,
  SmartMessage,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class PingHandler {
  @Command({ name: 'ping', aliases: ['pong'] })
  async onPing(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(SmartMessage.text('pong!'));
  }
}
```

#### 5. Đăng ký Handler

Thêm handler vào `app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NezonModule } from '@n0xgg04/nezon';
import { PingHandler } from './ping.handler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? '',
      botId: process.env.MEZON_BOT_ID ?? '',
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

- Trả về tuple `[ManagedMessage]`
- `ManagedMessage` có các methods: `reply()`, `update()`, `delete()`
- Type: `Nezon.AutoContext` = `[ManagedMessage]`

### `SmartMessage.text()`

```ts
SmartMessage.text('pong!')
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

## Troubleshooting

### Bot không phản hồi

1. Kiểm tra token và bot ID trong `.env`
2. Đảm bảo bot đã được thêm vào channel/clan
3. Kiểm tra console logs để xem có lỗi không

### Module không được load

1. Đảm bảo handler được thêm vào `providers` trong module
2. Kiểm tra `@Injectable()` decorator
3. Đảm bảo module được import vào `AppModule`

### Type errors

1. Đảm bảo đã import type từ `@n0xgg04/nezon`
2. Sử dụng namespace `Nezon` cho types: `Nezon.AutoContext`, `Nezon.Args`, etc.

## Next Steps

- [Message Template](/docs/message-template/text-message) - Tìm hiểu cách tạo các loại message
- [Interaction](/docs/interaction/command) - Tìm hiểu về Command, Component, Events
- [Decorators](/docs/decorators) - Xem danh sách đầy đủ decorators

