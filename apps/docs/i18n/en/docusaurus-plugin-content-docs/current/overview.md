---
id: overview
title: Nezon Introduction
sidebar_position: 1
---

Nezon is a NestJS library for building bots on the **Mezon** platform quickly. It provides a decorator-first API, typed injection, and convenient builders to help you focus on logic instead of wiring details with the Mezon SDK.

## Why Choose Nezon?

Compared to using the Mezon SDK directly, Nezon offers the following benefits:

### 🎯 Decorator-First API

Instead of managing event listeners and command handlers manually, you just declare them with decorators:

```ts
@Command('ping')
async onPing(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(SmartMessage.text('pong!'));
}
```

### 🔒 Type Safety

All decorators are typed with the `Nezon` namespace, providing better TypeScript autocomplete and type checking:

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

No need to manually create `ChannelMessageContent`, use a fluent API:

```ts
await message.reply(
  SmartMessage.text("Hello!")
    .addButton(new ButtonBuilder().setLabel("Click Me"))
    .addEmbed(new EmbedBuilder().setTitle("Rich Card"))
);
```

### 🔄 Auto Lifecycle Management

Nezon automatically manages:

- Bot login when the app starts
- Event listener registration and cleanup
- Entity caching to reduce API calls
- Graceful shutdown when the app closes

### 📦 Component with onClick Handlers

Create buttons with inline handlers, no need for separate component handlers:

```ts
new ButtonBuilder().setLabel("Click Me").onClick(async (context) => {
  await context.message.reply("Clicked!");
});
```

## Key Features

- ✅ **Command Decorators**: `@Command` with aliases, prefix, and auto argument parsing
- ✅ **Component Decorators**: `@Component` with pattern matching and named parameters
- ✅ **Event Listeners**: `@On`, `@Once` to listen to Mezon events
- ✅ **Typed Injection**: `@Message`, `@Channel`, `@User`, `@Clan`, `@AutoContext`, ...
- ✅ **SmartMessage Builder**: Text, System, Image, Voice, with buttons, embeds, files
- ✅ **ButtonBuilder**: Fluent API with onClick handlers
- ✅ **EmbedBuilder**: Rich embeds with form inputs
- ✅ **Named Parameters**: RESTful pattern in component IDs (`/user/:id/:action`)
- ✅ **Auto Context**: `ManagedMessage` with `reply`, `update`, `delete`, `sendDM` methods and `DMHelper` for sending DMs

## Comparison with Mezon SDK

| Feature            | Mezon SDK                      | Nezon                       |
| ------------------ | ------------------------------ | --------------------------- |
| Command handling   | Manual event listener          | `@Command` decorator        |
| Component handling | Manual pattern matching        | `@Component` with pattern   |
| Type safety        | Partial                        | Full with `Nezon` namespace |
| Message building   | Manual `ChannelMessageContent` | `SmartMessage` builder      |
| Button creation    | Manual object                  | `ButtonBuilder` fluent API  |
| Lifecycle          | Manual management              | Auto with `NezonModule`     |
| Context injection  | Manual fetch                   | Decorator injection         |

## Quick Start

> **First step:** Create a new bot at [https://mezon.ai/developers/applications](https://mezon.ai/developers/applications) to get `MEZON_TOKEN` and `MEZON_BOT_ID`

### Create a New Project (Recommended)

```bash
npx create-mezon-bot my-bot
cd my-bot
cp .env.example .env
# Edit .env with MEZON_TOKEN and MEZON_BOT_ID
yarn start:dev
```

### Or Install into Existing Project

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

## Documentation Roadmap

1. [Installation](./installation.md) – installation & quick example.
2. [Bot Context](./guides/data-access.md) – read payload, channel, clan, user, form.
3. [Logic & Event Handling](./guides/logic-events.md) – command/component/onClick/@On.
4. [Message Builder](./message-template/overview.md) + sub-pages (text, attachments, embed, DM).
5. [Sending Messages](./messaging/send-message.md) – reply, channel helper, DM helper, raw client.
6. [Utility Service](./nezon/utils.md) – `NezonUtilsService`.
7. [Examples](./examples.md) – list of demos in the example bot.
8. [Decorators](./decorators.md) – complete reference.

## Links

- [GitHub Repository](https://github.com/n0xgg04/nezon)
- [Mezon SDK](https://github.com/mezonhq/mezon-sdk)
