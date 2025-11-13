---
id: examples
title: Examples
sidebar_position: 6
---

Các ví dụ chi tiết cho từng decorator và tính năng.

## @Command Examples

### Basic Command

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('ping')
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

### Command với Arguments

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

### Command với Aliases

```ts
@Command({ name: 'help', aliases: ['h', '?'] })
async onHelp(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('Help message'));
}
```

## @Component Examples

### Basic Component

```ts
import { Component, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Component('click/confirm')
async onConfirm(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('Confirmed!'));
}
```

### Component với Named Parameters

```ts
@Component({ pattern: '/user/:user_id/:action' })
async onUserAction(
  @ComponentParams('user_id') userId: string | undefined,
  @ComponentParams('action') action: string | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  await message.reply(
    SmartMessage.text(`User ${userId}: ${action}`)
  );
}
```

## onClick Examples

### Basic onClick

```ts
import { Command, AutoContext, SmartMessage, ButtonBuilder, ButtonStyle } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('button')
async onButton(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.text('Click the button!')
      .addButton(
        new ButtonBuilder()
          .setLabel('Click Me')
          .setStyle(ButtonStyle.Primary)
          .onClick(async (context) => {
            await context.message.reply(SmartMessage.text('Clicked!'));
          })
      )
  );
}
```

### onClick với Context

```ts
@Command('info')
async onInfo(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.text('Get info:')
      .addButton(
        new ButtonBuilder()
          .setLabel('Show Info')
          .setStyle(ButtonStyle.Info)
          .onClick(async ({ message, channel, user, clan }) => {
            const info = `
Channel: ${channel?.name ?? 'unknown'}
User: ${user?.username ?? 'unknown'}
Clan: ${clan?.name ?? 'unknown'}
            `.trim();
            await message.reply(SmartMessage.text(info));
          })
      )
  );
}
```

## @On Examples

### Channel Message Listener

```ts
import { On, ChannelMessagePayload, MessageContent } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.ChannelMessage)
async onMessage(
  @ChannelMessagePayload() payload: Nezon.ChannelMessage,
  @MessageContent() content: string | undefined,
) {
  console.log('New message:', content);
}
```

## SmartMessage Examples

### Text với Buttons

```ts
@Command('menu')
async onMenu(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.text('Choose an option:')
      .addButton(new ButtonBuilder().setLabel('Option 1'))
      .addButton(new ButtonBuilder().setLabel('Option 2'))
  );
}
```

### Embed với Form

```ts
@Command('poll')
async onPoll(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.build()
      .addEmbed(
        new EmbedBuilder()
          .setTitle('Create Poll')
          .addTextField('Title', 'title')
          .addSelectField('Type', 'type', [
            { label: 'Single', value: 'SINGLE' },
            { label: 'Multiple', value: 'MULTIPLE' },
          ])
      )
  );
}
```

Xem thêm các ví dụ chi tiết trong từng trang documentation.

