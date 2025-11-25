---
id: installation
title: Installation
sidebar_position: 2
---

Guide to installing Nezon and creating your first bot with a ping-pong feature.

## Requirements

- Node.js >= 18
- Mezon bot token and bot ID

> **Get bot token and bot ID:** Create a new bot at [https://mezon.ai/developers/applications](https://mezon.ai/developers/applications)

## Installation & Quick Example

If you want to try it quickly in an existing project:

1. Install the package:

   ```bash
   yarn add @n0xgg04/nezon
   # or npm install @n0xgg04/nezon
   ```

2. Declare the module:

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

3. Create a basic handler:

   ```ts
   @Injectable()
   export class PingHandler {
     @Command("ping")
     async onPing(@AutoContext() [message]: Nezon.AutoContext) {
       await message.reply(Nezon.SmartMessage.text("pong!"));
     }
   }
   ```

4. Add `PingHandler` to the module's `providers`, run `yarn start:dev`, and type `*ping` in Mezon.

---

Alternatively, you can choose one of the two methods below:

### Method 1: Create a New Project (Recommended) ⭐

Use `create-mezon-bot` to create a project with a ready template:

```bash
npx create-mezon-bot my-bot
```

Or:

```bash
npm create mezon-bot my-bot
```

This command will automatically:

- ✅ Create a complete NestJS project structure
- ✅ Install all dependencies (`@n0xgg04/nezon`, `@nestjs/*`, etc.)
- ✅ Create example handlers with demo features
- ✅ Configure `NezonModule` ready to use
- ✅ Create `.env.example` with template

Then:

```bash
cd my-bot
cp .env.example .env
```

Edit `.env` and add credentials:

```env
MEZON_TOKEN=your_mezon_token_here
MEZON_BOT_ID=your_bot_id_here
```

Run the bot:

```bash
yarn start:dev
```

The bot will automatically connect and be ready to receive commands!

### Method 2: Install into Existing Project

If you already have a NestJS project:

#### 1. Install Package

```bash
yarn add @n0xgg04/nezon
```

or with npm:

```bash
npm install @n0xgg04/nezon
```

Make sure `mezon-sdk` is installed (declared as a peer dependency).

#### 2. Configure Module

Create or update `app.module.ts`:

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

#### 3. Configure Environment

Create a `.env` file:

```env
MEZON_TOKEN=your_bot_token_here
MEZON_BOT_ID=your_bot_id_here
```

#### 4. Create Handler

Create `ping.handler.ts`:

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

#### 5. Register Handler

Add the handler to `app.module.ts`:

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

## Run Bot

```bash
yarn start:dev
```

or

```bash
npm run start:dev
```

## Test Bot

In Mezon, send a message:

```
*ping
```

or

```
*pong
```

The bot will respond: `pong!`

### If You Use create-mezon-bot

The created project already includes many example commands for you to reference:

- `*ping` / `*pong` - Ping pong command
- `*button` - Demo button with setCustomId
- `*onclick` - Demo button with onClick handler
- `*image` - Demo image attachments
- `*embed` - Demo embed messages
- `*form` - Demo form with text fields and select fields
- `*file` - Demo file attachments
- `*update` - Demo message update with buttons
- `*slots` - Demo animated embed (slot machine) with `addAnimatedImage`

See the `src/bot/examples/` directory (e.g., `example-command.handlers.ts`, `example-embed.handlers.ts`, ...) to learn how to use Nezon features.

## Code Explanation

### `@Command` Decorator

```ts
@Command({ name: 'ping', aliases: ['pong'] })
```

- `name`: Main command name (default prefix `*`)
- `aliases`: Alternative names for the command
- Can use short string: `@Command('ping')`

### `@AutoContext` Decorator

```ts
@AutoContext() [message]: Nezon.AutoContext
```

- **No key**: Returns tuple `[ManagedMessage, DMHelper, ChannelHelper]`
- **With key `'message'`**: Returns `ManagedMessage` (type: `Nezon.AutoContextType.Message`)
- **With key `'dm'`**: Returns `DMHelper` (type: `Nezon.AutoContextType.DM`)
- **With key `'channel'`**: Returns `ChannelHelper` (type: `Nezon.AutoContextType.Channel`)
- `ManagedMessage` has methods: `reply()`, `update()`, `delete()`, `sendDM()`
- `DMHelper` has method: `send(userId, message)` to send DM
- `ChannelHelper` has `.send()` to post a new message to the current channel and `.find(channelId)` to bind to another channel

**Example 1: Get entire tuple (backward compatible)**

```ts
@Command('ping')
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

**Example 2: Get specific element by key**

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
  await channel.send(SmartMessage.text('Announcement in current channel!'));
}

@Command('broadcast-to')
async onBroadcastTo(
  @Args() args: Nezon.Args,
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  const [channelId] = args;
  if (!channel || !channelId) {
    await channel?.send(
      SmartMessage.text('Usage: *broadcast-to <channel_id>'),
    );
    return;
  }
  await channel
    .find(channelId)
    .send(SmartMessage.text(`Sending announcement to channel ${channelId}`));
}

> **Note**: In event handlers (`@On`, `@Once`), `channel` may be `null` because there's no fixed channel context.
```

### `SmartMessage.text()`

```ts
SmartMessage.text("pong!");
```

- Creates a simple text message
- Returns an object that can be passed to `message.reply()`
- Equivalent to `{ text: 'pong!' }`

## Advanced Examples

### Command with Arguments

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

Usage: `*greet John` → Bot reply: `Hello, John!`

### Command with Custom Prefix

```ts
@Command({ name: 'ping', prefix: '!' })
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

Usage: `!ping` (instead of `*ping`)

### Command with MessageContent

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

Usage: `*echo Hello World` → Bot reply: `Hello World`

## Create Project with create-mezon-bot

`create-mezon-bot` is a CLI tool to quickly create a Mezon bot project with Nezon. The created project will include:

- ✅ Complete NestJS structure
- ✅ NezonModule configured
- ✅ Example handlers with demo features
- ✅ TypeScript configuration
- ✅ All necessary dependencies

### Usage

```bash
npx create-mezon-bot my-bot
```

After creating the project, you'll have:

- `src/bot/examples/` - Set of example handlers organized by module (`example-command`, `example-embed`, ...)
- `.env.example` - Template for environment variables
- `package.json` - Already includes all dependencies

### Available Example Commands

The created project will have these example commands ready:

- `*ping` / `*pong` - Ping pong command
- `*button` - Demo button with setCustomId
- `*onclick` - Demo button with onClick handler
- `*image` - Demo image attachments
- `*embed` - Demo embed messages
- `*form` - Demo form with text fields and select fields
- `*file` - Demo file attachments
- `*update` - Demo message update with buttons

See also: [create-mezon-bot on npm](https://www.npmjs.com/package/create-mezon-bot)

## Troubleshooting

- **Bot not responding:** Check token/ID, ensure bot has joined clan and check console logs.
- **Module not loaded:** Make sure handler has `@Injectable()` and is added to `providers`.
- **Type errors:** Import types from `@n0xgg04/nezon` and use `Nezon` namespace (e.g., `Nezon.AutoContext`).

## Next Steps

1. [Bot Context](./guides/data-access.md) – read message, channel, clan, form data...
2. [Logic & Event Handling](./guides/logic-events.md) – command, component, onClick, @On/@Once.
3. [Message Builder](./message-template/overview.md) – build content (text, embed, form...).
4. [Sending Messages](./messaging/send-message.md) – reply, channel helper, DM helper, raw client.
5. [Utility Service](./nezon/utils.md) – `NezonUtilsService`.
6. [Examples](./examples.md) – list of features available in the example bot.
7. [Decorators](./decorators.md) – complete decorator reference.
