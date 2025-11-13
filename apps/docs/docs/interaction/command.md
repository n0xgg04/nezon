---
id: command
title: "@Command"
sidebar_position: 1
---

Hướng dẫn sử dụng `@Command` decorator để tạo text commands cho bot.

## Tổng quan

`@Command` decorator cho phép bạn định nghĩa text commands mà bot sẽ phản hồi. Command mặc định sử dụng prefix `*` và có thể tùy chỉnh.

### Cú pháp cơ bản

```ts
@Command(name: string | NezonCommandOptions)
```

## Ví dụ đơn giản

```ts
import { Injectable } from '@nestjs/common';
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class PingHandler {
  @Command('ping')
  async onPing(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(SmartMessage.text('pong!'));
  }
}
```

**Sử dụng:** `*ping` → Bot reply: `pong!`

## Options

### Với string (short form)

```ts
@Command('ping')
```

Tương đương với:

```ts
@Command({ name: 'ping' })
```

### Với object (full options)

```ts
@Command({
  name: 'ping',
  aliases: ['pong', 'p'],
  prefix: '!',
})
```

### Type Definition

```ts
interface NezonCommandOptions {
  name: string;              // Tên command (bắt buộc)
  aliases?: string[];        // Các tên thay thế
  prefix?: string;           // Prefix tùy chỉnh (mặc định: '*')
}
```

## Aliases

Cho phép command có nhiều tên gọi:

```ts
@Command({ name: 'ping', aliases: ['pong', 'p'] })
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

**Sử dụng:**
- `*ping` → `pong!`
- `*pong` → `pong!`
- `*p` → `pong!`

## Custom Prefix

Thay đổi prefix mặc định:

```ts
@Command({ name: 'ping', prefix: '!' })
async onPing(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
}
```

**Sử dụng:** `!ping` (thay vì `*ping`)

## Arguments

Lấy arguments từ command với `@Args()`:

```ts
import { Command, Args, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('greet')
async onGreet(
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const name = args[0] ?? 'Anonymous';
  await message.reply(SmartMessage.text(`Hello, ${name}!`));
}
```

**Sử dụng:** `*greet John` → Bot reply: `Hello, John!`

### Lấy argument cụ thể

```ts
import { Command, Arg, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('greet')
async onGreet(
  @Arg(0) name: string | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const greeting = name ? `Hello, ${name}!` : 'Hello!';
  await message.reply(SmartMessage.text(greeting));
}
```

**Type:**
```ts
@Arg(index: number): ParameterDecorator
// Trả về: string | undefined
```

## Message Content

Lấy toàn bộ nội dung message (bao gồm cả command):

```ts
import { Command, MessageContent, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('echo')
async onEcho(
  @MessageContent() content: string | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const text = content?.replace('*echo', '').trim() ?? 'Nothing to echo';
  await message.reply(SmartMessage.text(text));
}
```

**Sử dụng:** `*echo Hello World` → Bot reply: `Hello World`

**Type:**
```ts
@MessageContent(): ParameterDecorator
// Trả về: string | undefined
```

## Context Injection

Command handler có thể inject nhiều context:

```ts
import { Command, User, Channel, Clan, Client, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('info')
async onInfo(
  @User() user: Nezon.User | undefined,
  @Channel() channel: Nezon.Channel | undefined,
  @Clan() clan: Nezon.Clan | undefined,
  @Client() client: Nezon.Client,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const info = `
User: ${user?.username ?? 'unknown'}
Channel: ${channel?.name ?? 'unknown'}
Clan: ${clan?.name ?? 'unknown'}
  `.trim();
  
  await message.reply(SmartMessage.text(info));
}
```

## Ví dụ hoàn chỉnh

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  Args,
  Arg,
  MessageContent,
  User,
  Channel,
  AutoContext,
  SmartMessage,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ExampleHandler {
  @Command({ name: 'ping', aliases: ['pong'] })
  async onPing(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(SmartMessage.text('pong!'));
  }

  @Command('greet')
  async onGreet(
    @Args() args: Nezon.Args,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    const name = args[0] ?? 'Anonymous';
    await message.reply(SmartMessage.text(`Hello, ${name}!`));
  }

  @Command({ name: 'admin', prefix: '!' })
  async onAdmin(
    @Arg(0) action: string | undefined,
    @User() user: Nezon.User | undefined,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    if (action === 'kick') {
      await message.reply(SmartMessage.text(`Kicking user: ${user?.username}`));
    }
  }
}
```

## Best Practices

1. **Sử dụng aliases cho commands phổ biến**
   ```ts
   @Command({ name: 'help', aliases: ['h', '?'] })
   ```

2. **Validate arguments trước khi sử dụng**
   ```ts
   const name = args[0];
   if (!name) {
     await message.reply(SmartMessage.text('Please provide a name!'));
     return;
   }
   ```

3. **Sử dụng @AutoContext() cho message operations**
   ```ts
   @AutoContext() [message]: Nezon.AutoContext
   // message.reply(), message.update(), message.delete()
   ```

## API Reference

### @Command()

```ts
function Command(
  name: string | NezonCommandOptions
): MethodDecorator
```

### @Args()

```ts
function Args(): ParameterDecorator
// Trả về: Nezon.Args = string[]
```

### @Arg()

```ts
function Arg(index: number): ParameterDecorator
// Trả về: string | undefined
```

### @MessageContent()

```ts
function MessageContent(): ParameterDecorator
// Trả về: string | undefined
```

## Xem thêm

- [@Component](/docs/interaction/component) - Component handlers
- [@On, @Once](/docs/interaction/events) - Event listeners
- [Decorators](/docs/decorators) - Danh sách đầy đủ decorators

