---
id: overview
title: Giới thiệu Nezon
sidebar_position: 1
---

Nezon là thư viện NestJS giúp xây dựng bot cho nền tảng **Mezon** nhanh chóng. Thư viện cung cấp decorator-first API, typed injection, và các builder tiện dụng để giúp bạn tập trung vào logic thay vì wiring chi tiết với Mezon SDK.

## Tại sao chọn Nezon?

So với việc sử dụng Mezon SDK trực tiếp, Nezon mang lại những lợi ích sau:

### 🎯 Decorator-First API

Thay vì phải tự quản lý event listeners và command handlers, bạn chỉ cần khai báo bằng decorator:

```ts
@Command('ping')
async onPing(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(SmartMessage.text('pong!'));
}
```

### 🔒 Type Safety

Tất cả decorator đều được typed với namespace `Nezon`, giúp TypeScript hỗ trợ autocomplete và type checking tốt hơn:

```ts
@Command('greet')
async greet(
  @User() user: Nezon.User,        // ✅ Typed
  @Channel() channel: Nezon.Channel, // ✅ Typed
  @Args() args: Nezon.Args,         // ✅ Typed
) {
  // ...
}
```

### 🚀 SmartMessage Builder

Không cần phải tạo `ChannelMessageContent` thủ công, sử dụng fluent API:

```ts
await message.reply(
  SmartMessage.text("Hello!")
    .addButton(new ButtonBuilder().setLabel("Click Me"))
    .addEmbed(new EmbedBuilder().setTitle("Rich Card"))
);
```

### 🔄 Auto Lifecycle Management

Nezon tự động quản lý:

- Đăng nhập bot khi app khởi động
- Đăng ký và cleanup event listeners
- Cache entities để giảm API calls
- Shutdown graceful khi app tắt

### 📦 Component với onClick Handlers

Tạo button với inline handler, không cần tạo component handler riêng:

```ts
new ButtonBuilder().setLabel("Click Me").onClick(async (context) => {
  await context.message.reply("Clicked!");
});
```

## Tính năng tiêu biểu

- ✅ **Command Decorators**: `@Command` với alias, prefix, và auto argument parsing
- ✅ **Component Decorators**: `@Component` với pattern matching và named parameters
- ✅ **Event Listeners**: `@On`, `@Once` để lắng nghe Mezon events
- ✅ **Typed Injection**: `@Message`, `@Channel`, `@User`, `@Clan`, `@AutoContext`, ...
- ✅ **SmartMessage Builder**: Text, System, Image, Voice, với buttons, embeds, files
- ✅ **ButtonBuilder**: Fluent API với onClick handlers
- ✅ **EmbedBuilder**: Rich embeds với form inputs
- ✅ **Named Parameters**: RESTful pattern trong component IDs (`/user/:id/:action`)
- ✅ **Auto Context**: `ManagedMessage` với `reply`, `update`, `delete`, `sendDM` methods và `DMHelper` để gửi DM

## So sánh với Mezon SDK

| Tính năng          | Mezon SDK                      | Nezon                      |
| ------------------ | ------------------------------ | -------------------------- |
| Command handling   | Manual event listener          | `@Command` decorator       |
| Component handling | Manual pattern matching        | `@Component` với pattern   |
| Type safety        | Partial                        | Full với namespace `Nezon` |
| Message building   | Manual `ChannelMessageContent` | `SmartMessage` builder     |
| Button creation    | Manual object                  | `ButtonBuilder` fluent API |
| Lifecycle          | Manual management              | Auto với `NezonModule`     |
| Context injection  | Manual fetch                   | Decorator injection        |

## Bắt đầu nhanh

> **Bước đầu tiên:** Tạo bot mới tại [https://mezon.ai/developers/applications](https://mezon.ai/developers/applications) để lấy `MEZON_TOKEN` và `MEZON_BOT_ID`

### Tạo project mới (Khuyến nghị)

```bash
npx create-mezon-bot my-bot
cd my-bot
cp .env.example .env
# Edit .env với MEZON_TOKEN và MEZON_BOT_ID
yarn start:dev
```

### Hoặc cài đặt vào project hiện có

```bash
yarn add @n0xgg04/nezon
```

```ts
import { Module } from "@nestjs/common";
import { NezonModule } from "@n0xgg04/nezon";

@Module({
  imports: [
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN,
      botId: process.env.MEZON_BOT_ID,
    }),
  ],
})
export class AppModule {}
```

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('ping')
async onPing(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(SmartMessage.text('pong!'));
}
```

## Lộ trình đọc tài liệu

1. [Installation](./installation.md) – cài đặt & quick example.
2. [Lấy thông tin](./guides/data-access.md) – đọc payload, channel, clan, user, form.
3. [Xử lý logic & event](./guides/logic-events.md) – command/component/onClick/@On.
4. [Message Builder](./message-template/overview.md) + các trang con (text, attachments, embed, DM).
5. [Gửi tin nhắn](./messaging/send-message.md) – reply, channel helper, DM helper, client thuần.
6. [Utility Service](./nezon/utils.md) – `NezonUtilsService`.
7. [Examples](./examples.md) – danh sách demo trong example bot.
8. [Decorators](./decorators.md) – reference đầy đủ.

## Liên kết

- [GitHub Repository](https://github.com/n0xgg04/nezon)
- [Mezon SDK](https://github.com/mezonhq/mezon-sdk)
