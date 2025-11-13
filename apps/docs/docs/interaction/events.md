---
id: events
title: "@On, @Once"
sidebar_position: 3
---

Hướng dẫn sử dụng `@On` và `@Once` decorators để lắng nghe Mezon SDK events.

## Tổng quan

`@On` và `@Once` decorators cho phép bạn lắng nghe các sự kiện từ Mezon SDK. `@On` lắng nghe mỗi lần event xảy ra, còn `@Once` chỉ lắng nghe một lần duy nhất.

### Cú pháp

```ts
@On(event: string)
@Once(event: string)
```

## @On Decorator

Lắng nghe event mỗi lần nó xảy ra.

### Ví dụ cơ bản

```ts
import { Injectable } from '@nestjs/common';
import { On, ChannelMessagePayload, MessageContent } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@Injectable()
export class MessageListener {
  @On(Events.ChannelMessage)
  async onMessage(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @MessageContent() content: string | undefined,
  ) {
    console.log('New message:', content);
  }
}
```

### Với Channel và User

```ts
import { Injectable } from '@nestjs/common';
import {
  On,
  ChannelMessagePayload,
  MessageContent,
  Channel,
  User,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@Injectable()
export class MessageListener {
  @On(Events.ChannelMessage)
  async onMessage(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @MessageContent() content: string | undefined,
    @Channel() channel: Nezon.Channel | undefined,
    @User() user: Nezon.User | undefined,
  ) {
    const channelName = channel?.name ?? 'unknown';
    const userName = user?.username ?? payload.username ?? 'unknown';
    console.log(`[${channelName}] ${userName}: ${content}`);
  }
}
```

## @Once Decorator

Chỉ lắng nghe event một lần duy nhất, thường dùng cho initialization.

### Ví dụ

```ts
import { Injectable } from '@nestjs/common';
import { Once } from '@n0xgg04/nezon';

@Injectable()
export class ReadyHandler {
  @Once('Ready')
  onReady() {
    console.log('Bot is ready!');
  }
}
```

### Với Client

```ts
import { Injectable } from '@nestjs/common';
import { Once, Client } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ReadyHandler {
  @Once('Ready')
  async onReady(@Client() client: Nezon.Client) {
    console.log('Bot logged in as:', client.user?.username);
    // Perform initialization tasks
  }
}
```

## Các Events phổ biến

### ChannelMessage

Lắng nghe tin nhắn mới trong channel:

```ts
@On(Events.ChannelMessage)
async onMessage(
  @ChannelMessagePayload() payload: Nezon.ChannelMessage,
  @MessageContent() content: string | undefined,
) {
  // Handle new message
}
```

### MessageButtonClicked

Lắng nghe khi button được click (thường dùng với `@Component`):

```ts
@On(Events.MessageButtonClicked)
async onButtonClick(
  @ComponentPayload() payload: Nezon.ComponentPayload,
) {
  // Handle button click
}
```

### TokenSend

Lắng nghe khi có token được gửi:

```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.TokenSend)
async onTokenSend(@EventPayload() payload: Nezon.TokenSendPayload) {
  console.log('Token sent:', payload);
  // payload có type: TokenSentEvent
  // Có thể truy cập: payload.from_user_id, payload.to_user_id, payload.amount, etc.
}
```

**Type:**
```ts
type TokenSendPayload = TokenSentEvent;
// Bao gồm: from_user_id, to_user_id, amount, token_type, etc.
```

### AddClanUser

Lắng nghe khi user được thêm vào clan:

```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.AddClanUser)
async onAddClanUser(@EventPayload() payload: Nezon.AddClanUserPayload) {
  console.log('User added to clan:', payload.user_id);
  console.log('Clan ID:', payload.clan_id);
  // payload có type: { user_id: string; clan_id: string; ... }
}
```

**Type:**
```ts
type AddClanUserPayload = {
  user_id: string;
  clan_id: string;
  [key: string]: unknown;
};
```

## Event Payload Injection

Bạn có thể inject payload trực tiếp:

```ts
@On(Events.ChannelMessage)
async onMessage(payload: Nezon.ChannelMessage) {
  // payload chứa toàn bộ thông tin message
  console.log('Message ID:', payload.message_id);
  console.log('Channel ID:', payload.channel_id);
  console.log('User ID:', payload.sender_id);
}
```

## Ví dụ hoàn chỉnh

```ts
import { Injectable } from '@nestjs/common';
import {
  On,
  Once,
  ChannelMessagePayload,
  MessageContent,
  Channel,
  User,
  Client,
  AutoContext,
  SmartMessage,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@Injectable()
export class EventHandlers {
  @Once('Ready')
  onReady(@Client() client: Nezon.Client) {
    console.log('Bot is ready!');
  }

  @On(Events.ChannelMessage)
  async onMessage(
    @ChannelMessagePayload() payload: Nezon.ChannelMessage,
    @MessageContent() content: string | undefined,
    @Channel() channel: Nezon.Channel | undefined,
    @User() user: Nezon.User | undefined,
  ) {
    // Log message
    const channelName = channel?.name ?? 'unknown';
    const userName = user?.username ?? 'unknown';
    console.log(`[${channelName}] ${userName}: ${content}`);

    // Auto-reply to mentions
    if (content?.includes('@bot')) {
      const message = await this.getMessage(payload);
      if (message) {
        await message.reply(SmartMessage.text('You mentioned me!'));
      }
    }
  }

  private async getMessage(payload: Nezon.ChannelMessage) {
    // Implementation to get message entity
    return null;
  }
}
```

## Type Definitions

```ts
// Events từ mezon-sdk
enum Events {
  ChannelMessage = 'ChannelMessage',
  MessageButtonClicked = 'MessageButtonClicked',
  TokenSend = 'TokenSend',
  AddClanUser = 'AddClanUser',
  // ... và nhiều events khác
}
```

## Best Practices

1. **Sử dụng @Once cho initialization**
   ```ts
   @Once('Ready')
   onReady() {
     // Setup tasks
   }
   ```

2. **Sử dụng typed decorators cho payload**
   ```ts
   @ChannelMessagePayload() payload: Nezon.ChannelMessage
   ```

3. **Cache entities để tránh fetch lại**
   ```ts
   @Channel() channel: Nezon.Channel | undefined
   // Channel đã được cache trong cùng request
   ```

## API Reference

### @On()

```ts
function On(event: string): MethodDecorator
```

### @Once()

```ts
function Once(event: string): MethodDecorator
```

### @ChannelMessagePayload()

```ts
function ChannelMessagePayload(): ParameterDecorator
// Trả về: Nezon.ChannelMessage
```

## Xem thêm

- [@Command](/docs/interaction/command) - Text commands
- [@Component](/docs/interaction/component) - Component handlers
- [Decorators](/docs/decorators) - Danh sách đầy đủ decorators

