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

## DM Examples

### Gửi DM với DMHelper

```ts
import { Command, AutoContext, SmartMessage, Args } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('dm')
async onDM(
  @Args() args: Nezon.Args,
  @AutoContext() [message, dm]: Nezon.AutoContext,
) {
  const userId = args[0];
  
  if (!userId) {
    await message.reply(SmartMessage.text('Sử dụng: *dm <user_id>'));
    return;
  }

  try {
    await dm.send(
      userId,
      SmartMessage.text('Đây là tin nhắn DM được gửi từ bot!'),
    );
    await message.reply(SmartMessage.text(`✅ Đã gửi DM đến ${userId}`));
  } catch (error) {
    await message.reply(
      SmartMessage.text(`❌ Lỗi: ${(error as Error).message}`),
    );
  }
}
```

### Gửi DM tự động với sendDM()

```ts
@Command('senddm')
async onSendDM(@AutoContext() [message]: Nezon.AutoContext) {
  try {
    await message.sendDM(
      SmartMessage.text('Đây là tin nhắn DM được gửi tự động cho bạn!'),
    );
    await message.reply(SmartMessage.text('✅ Đã gửi DM cho bạn!'));
  } catch (error) {
    await message.reply(
      SmartMessage.text(`❌ Lỗi: ${(error as Error).message}`),
    );
  }
}
```

### DM với Rich Content

```ts
@Command('dm-rich')
async onDMRich(
  @Args() args: Nezon.Args,
  @AutoContext() [message, dm]: Nezon.AutoContext,
) {
  const userId = args[0];
  
  await dm.send(
    userId,
    SmartMessage.text('DM với embed và button!')
      .addEmbed(
        new EmbedBuilder()
          .setTitle('Rich DM')
          .setDescription('Đây là DM với embed')
          .setColor('#00ff00'),
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Click Me')
          .setStyle(ButtonStyle.Primary)
          .onClick(async (context) => {
            await context.message.reply(SmartMessage.text('Button trong DM được click!'));
          }),
      ),
  );
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

