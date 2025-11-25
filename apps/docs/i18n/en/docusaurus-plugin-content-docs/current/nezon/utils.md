---
id: utils
title: NezonUtils - Utility Service
sidebar_position: 1
---

`NezonUtilsService` (also known as `nezonSmartUtils`) is a utility service that provides helper methods to interact with the Mezon SDK easily and safely. This service is automatically injected into command handlers, component handlers, and event handlers through the `@NezonUtils()` decorator.

## Overview

`NezonUtilsService` provides utility methods to:

- **Get entities**: Fetch clan, channel, message from Mezon SDK with automatic error handling
- **Send token**: Send tokens to users easily
- **Cache management**: Automatically use cache when possible to optimize performance

## Usage

### Inject NezonUtilsService

Use the `@NezonUtils()` decorator to inject the service into a handler:

```ts
import { Command, NezonUtils, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('info')
async onInfo(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const channel = await utils.getChannel(message.channelId!);
  if (channel) {
    await message.reply(
      SmartMessage.text(`Channel: ${channel.name}`)
    );
  }
}
```

### Inject via Constructor (NestJS Dependency Injection)

You can also inject `NezonUtilsService` through the class constructor:

```ts
import { Injectable } from "@nestjs/common";
import { NezonUtilsService } from "@n0xgg04/nezon";
import { Command, AutoContext, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Injectable()
export class MyHandlers {
  constructor(private readonly utils: NezonUtilsService) {}

  @Command("test")
  async onTest(@AutoContext() [message]: Nezon.AutoContext) {
    const channel = await this.utils.getChannel(message.channelId!);
    await message.reply(
      SmartMessage.text(`Channel ID: ${channel?.id ?? "unknown"}`)
    );
  }
}
```

## API Reference

### `getClan(id: string): Promise<Clan | undefined>`

Get clan entity from Mezon SDK. Automatically checks cache before fetching.

**Parameters:**

- `id: string` - Clan ID to get

**Returns:**

- `Promise<Clan | undefined>` - Clan entity or `undefined` if not found or error occurred

**Example:**

```ts
@Command('clan')
async onClan(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const clanId = args[0];
  if (!clanId) {
    await message.reply(SmartMessage.text('Usage: *clan <clan_id>'));
    return;
  }

  const clan = await utils.getClan(clanId);
  if (clan) {
    await message.reply(
      SmartMessage.text(`Clan: ${clan.name}\nID: ${clan.id}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Clan not found with ID: ${clanId}`)
    );
  }
}
```

**Notes:**

- This method automatically logs a warning if an error occurs
- Checks cache before fetching to optimize performance
- Returns `undefined` instead of throwing an error for easier error handling

### `getChannel(id: string): Promise<TextChannel | undefined>`

Get channel entity from Mezon SDK.

**Parameters:**

- `id: string` - Channel ID to get

**Returns:**

- `Promise<TextChannel | undefined>` - Channel entity or `undefined` if not found or error occurred

**Example:**

```ts
@Command('channel')
async onChannel(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const channelId = args[0] || message.channelId;

  if (!channelId) {
    await message.reply(SmartMessage.text('No channel ID'));
    return;
  }

  const channel = await utils.getChannel(channelId);
  if (channel) {
    await message.reply(
      SmartMessage.text(`Channel: ${channel.name}\nID: ${channel.id}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Channel not found with ID: ${channelId}`)
    );
  }
}
```

**Notes:**

- This method automatically logs a warning if an error occurs
- Returns `undefined` instead of throwing an error

### `getMessage(id: string, channelId?: string): Promise<Message | undefined>`

Get message entity from Mezon SDK. Can search in a specific channel or search in all channels.

**Parameters:**

- `id: string` - Message ID to get
- `channelId?: string` - (Optional) Channel ID to search message in. If not provided, will search in all channels.

**Returns:**

- `Promise<Message | undefined>` - Message entity or `undefined` if not found or error occurred

**Example 1: Find message in specific channel**

```ts
@Command('message')
async onMessage(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  const channelId = args[1] || message.channelId;

  if (!messageId) {
    await message.reply(SmartMessage.text('Usage: *message <message_id> [channel_id]'));
    return;
  }

  const msg = await utils.getMessage(messageId, channelId);
  if (msg) {
    await message.reply(
      SmartMessage.text(`Message ID: ${msg.id}\nContent: ${msg.content?.t ?? 'N/A'}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Message not found with ID: ${messageId}`)
    );
  }
}
```

**Example 2: Find message in all channels**

```ts
@Command('find-message')
async onFindMessage(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  if (!messageId) {
    await message.reply(SmartMessage.text('Usage: *find-message <message_id>'));
    return;
  }

  const msg = await utils.getMessage(messageId);
  if (msg) {
    await message.reply(
      SmartMessage.text(`Found message:\nID: ${msg.id}\nChannel: ${msg.channel_id}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Message not found with ID: ${messageId}`)
    );
  }
}
```

**Notes:**

- If `channelId` is not provided, the method will search in all channels (may be slow)
- Should provide `channelId` when you know the channel to optimize performance
- This method automatically logs a warning if an error occurs
- Returns `undefined` instead of throwing an error

### `getManagedMessage(id: string, channelId?: string): Promise<ManagedMessage | undefined>`

Get message entity and wrap it in `ManagedMessage` to use helper methods like `reply()`, `update()`, `delete()`, `react()`, etc.

**Parameters:**

- `id: string` - Message ID to get
- `channelId?: string` - (Optional) Channel ID containing the message. If not provided, will search in all channels

**Returns:**

- `Promise<ManagedMessage | undefined>` - ManagedMessage instance or `undefined` if not found

**Example:**

```ts
@Command('react-message')
async onReactMessage(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  if (!messageId) {
    await message.reply(SmartMessage.text('Usage: *react-message <message_id>'));
    return;
  }

  const managedMsg = await utils.getManagedMessage(messageId, message.channelId);
  if (managedMsg) {
    await managedMsg.addReaction('👍');
    await managedMsg.reply(SmartMessage.text('Reaction added!'));
  } else {
    await message.reply(SmartMessage.text('Message not found'));
  }
}
```

**Example with update and delete:**

```ts
@Command('edit-message')
async onEditMessage(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  const newText = args.slice(1).join(' ');

  if (!messageId || !newText) {
    await message.reply(SmartMessage.text('Usage: *edit-message <message_id> <new_text>'));
    return;
  }

  const managedMsg = await utils.getManagedMessage(messageId, message.channelId);
  if (managedMsg) {
    try {
      await managedMsg.update(SmartMessage.text(newText));
      await message.reply(SmartMessage.text('✅ Message updated'));
    } catch (error) {
      await message.reply(SmartMessage.text('❌ Cannot update message (can only update bot messages)'));
    }
  }
}
```

**Notes:**

- `ManagedMessage` provides methods: `reply()`, `update()`, `delete()`, `react()`, `addReaction()`, `removeReaction()`, `sendDM()`, `fetch()`
- `update()` and `delete()` only work with bot messages (will throw error if not)
- `react()` works with both user and bot messages
- Should provide `channelId` to optimize performance

### `sendToken(recipientId: string, amount: number, note?: string): Promise<{ ok: boolean; tx_hash: string; error: string } | undefined>`

Send tokens to a user.

**Parameters:**

- `recipientId: string` - User ID of the recipient
- `amount: number` - Amount of tokens to send
- `note?: string` - (Optional) Note to include with the transaction

**Returns:**

- `Promise<{ ok: boolean; tx_hash: string; error: string } | undefined>` - Transaction result or `undefined` if error occurred

**Response Structure:**

```ts
{
  ok: boolean; // true if successful, false if failed
  tx_hash: string; // Transaction hash
  error: string; // Error message (if any)
}
```

**Example:**

```ts
@Command('send-token')
async onSendToken(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const recipientId = args[0];
  const amount = parseFloat(args[1]);

  if (!recipientId || isNaN(amount) || amount <= 0) {
    await message.reply(
      SmartMessage.text('Usage: *send-token <user_id> <amount> [note]')
    );
    return;
  }

  const note = args.slice(2).join(' ') || undefined;
  const result = await utils.sendToken(recipientId, amount, note);

  if (result) {
    if (result.ok) {
      await message.reply(
        SmartMessage.text(
          `✅ Sent ${amount} tokens to ${recipientId}\n` +
          `Transaction hash: ${result.tx_hash}`
        )
      );
    } else {
      await message.reply(
        SmartMessage.text(`❌ Error: ${result.error}`)
      );
    }
  } else {
    await message.reply(
      SmartMessage.text('❌ Cannot send tokens. Please try again later.')
    );
  }
}
```

**Example with note:**

```ts
@Command('tip')
async onTip(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @User() user: Nezon.User | undefined,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const amount = parseFloat(args[0]);
  if (!user || isNaN(amount) || amount <= 0) {
    await message.reply(SmartMessage.text('Usage: *tip <amount>'));
    return;
  }

  const result = await utils.sendToken(
    user.id,
    amount,
    `Tip from ${message.raw.sender_id}`
  );

  if (result?.ok) {
    await message.reply(
      SmartMessage.text(`✅ Tipped ${amount} tokens to ${user.display_name}!`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`❌ Error sending tip: ${result?.error ?? 'Unknown error'}`)
    );
  }
}
```

**Notes:**

- This method requires the bot to have permission to send tokens
- Automatically logs a warning if an error occurs
- Returns `undefined` if `client.sendToken` doesn't exist or an error occurred

## Best Practices

### 1. Always Check Results

All methods of `NezonUtilsService` can return `undefined`. Always check before using:

```ts
const channel = await utils.getChannel(channelId);
if (!channel) {
  await message.reply(SmartMessage.text("Channel not found"));
  return;
}
```

### 2. Use with Error Handling

```ts
try {
  const clan = await utils.getClan(clanId);
  if (clan) {
    await message.reply(SmartMessage.text(`Clan: ${clan.name}`));
  }
} catch (error) {
  this.logger.error("Failed to get clan", error);
  await message.reply(SmartMessage.text("An error occurred"));
}
```

### 3. Optimize Performance with channelId

When finding messages, always provide `channelId` if possible:

```ts
const msg = await utils.getMessage(messageId, channelId);
```

### 4. Validate Input Before Sending Tokens

```ts
const amount = parseFloat(args[0]);
if (isNaN(amount) || amount <= 0) {
  await message.reply(SmartMessage.text("Invalid amount"));
  return;
}
```

### 5. Use with Other Decorators

Combine `@NezonUtils()` with other decorators for cleaner code:

```ts
@Command('info')
async onInfo(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Channel() channel: Nezon.Channel | undefined,
  @User() user: Nezon.User | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  if (!channel || !user) {
    await message.reply(SmartMessage.text('Missing information'));
    return;
  }
}
```

## Comparison with Raw Mezon SDK

| Feature        | NezonUtilsService                          | Raw Mezon SDK                     |
| -------------- | ------------------------------------------ | --------------------------------- |
| Error Handling | ✅ Automatic logging and returns undefined | ⚠️ Must handle try-catch yourself |
| Cache          | ✅ Automatically uses cache                | ⚠️ Must manage cache yourself     |
| Type Safety    | ✅ Full TypeScript support                 | ⚠️ Manual typing                  |
| Code Clarity   | ✅ Clear methods, easy to read             | ⚠️ Must know API structure        |
| Null Safety    | ✅ Returns undefined instead of throw      | ⚠️ May throw errors               |

## Type Reference

```ts
import type { Nezon } from '@n0xgg04/nezon';

@NezonUtils() utils: Nezon.NezonUtilsService
```

Or import directly:

```ts
import { NezonUtilsService } from '@n0xgg04/nezon';

constructor(private readonly utils: NezonUtilsService) {}
```

## See Also

- [Command Decorators](/docs/interaction/command) - How to use decorators in commands
- [Component Decorators](/docs/interaction/component) - How to use decorators in components
- [Event Handlers](/docs/interaction/events) - How to handle events
- [Decorators Reference](/docs/decorators) - Overview of all decorators
