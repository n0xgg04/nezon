---
id: component
title: "@Component"
sidebar_position: 2
---

Hướng dẫn sử dụng `@Component` decorator để xử lý button clicks và các component interactions.

## Tổng quan

`@Component` decorator cho phép bạn xử lý các sự kiện tương tác với components (buttons, selects, etc.) thông qua pattern matching trên `button_id`.

### Cú pháp cơ bản

```ts
@Component(options: NezonComponentOptions | string)
```

## Ví dụ đơn giản

```ts
import { Injectable } from '@nestjs/common';
import { Component, ComponentPayload, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ButtonHandler {
  @Component({ pattern: 'click/confirm' })
  async onConfirm(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.reply(SmartMessage.text('Confirmed!'));
  }
}
```

## Pattern Matching

### Exact Match

```ts
@Component({ pattern: 'click/confirm' })
```

Chỉ match với `button_id` chính xác là `'click/confirm'`.

### Regex Pattern

```ts
@Component({ pattern: '^click/.*' })
```

Match với mọi `button_id` bắt đầu bằng `'click/'`.

### String Short Form

```ts
@Component('click/confirm')
```

Tương đương với `@Component({ pattern: 'click/confirm' })`.

## Named Parameters (RESTful Pattern)

Component hỗ trợ named parameters giống REST API:

```ts
@Component({ pattern: '/user/:user_id/:action' })
async onUserAction(
  @ComponentParams('user_id') userId: string | undefined,
  @ComponentParams('action') action: string | undefined,
  @ComponentParams() allParams: Record<string, string> | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  console.log('User ID:', userId);
  console.log('Action:', action);
  console.log('All params:', allParams);
}
```

**Ví dụ button_id:** `/user/12345/kick`
- `userId` = `'12345'`
- `action` = `'kick'`
- `allParams` = `{ user_id: '12345', action: 'kick' }`

### Lấy tất cả parameters

```ts
@Component({ pattern: '/user/:user_id/:action' })
async onUserAction(
  @ComponentParams() params: Record<string, string> | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  // params = { user_id: '12345', action: 'kick' }
}
```

### Lấy parameter cụ thể

```ts
@Component({ pattern: '/user/:user_id/:action' })
async onUserAction(
  @ComponentParam('user_id') userId: string | undefined,
  @ComponentParam(0) firstParam: string | undefined, // Lấy theo index
  @AutoContext() [message]: Nezon.AutoContext,
) {
  // userId = '12345'
  // firstParam = '12345' (parameter đầu tiên)
}
```

## Component Payload

Lấy raw payload từ component click:

```ts
@Component('click/confirm')
async onConfirm(
  @ComponentPayload() payload: Nezon.ComponentPayload,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  console.log('Button ID:', payload.button_id);
  console.log('User ID:', payload.user_id);
  console.log('Channel ID:', payload.channel_id);
  console.log('Message ID:', payload.message_id);
}
```

**Type:**
```ts
type ComponentPayload = MessageButtonClicked;
// Bao gồm: button_id, user_id, channel_id, message_id, ...
```

## Component Target

Lấy message gốc (đã được cache) mà không cần fetch lại:

```ts
@Component('click/confirm')
async onConfirm(
  @ComponentTarget() targetMessage: Nezon.Message | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  if (targetMessage) {
    // Sử dụng message đã cache
    await targetMessage.reply(SmartMessage.text('Confirmed!'));
  }
}
```

**Type:**
```ts
@ComponentTarget(): ParameterDecorator
// Trả về: Nezon.Message | undefined
```

## Ví dụ hoàn chỉnh

### Với setCustomId

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  Component,
  ComponentParams,
  AutoContext,
  SmartMessage,
  ButtonBuilder,
  ButtonStyle,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ButtonHandler {
  @Command('button')
  async onButton(@AutoContext() [message]: Nezon.AutoContext) {
    const messageId = message.id ?? 'unknown';
    await message.reply(
      SmartMessage.text('Click the button!')
        .addButton(
          new ButtonBuilder()
            .setCustomId(`/demo/success/${messageId}`)
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success)
        )
    );
  }

  @Component({ pattern: '/demo/success/:message_id' })
  async onConfirm(
    @ComponentParams('message_id') targetId: string | undefined,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.reply(
      SmartMessage.text(`Confirmed! Message ID: ${targetId}`)
    );
  }
}
```

### Với onClick (khuyến nghị)

Xem [onClick handlers](/docs/interaction/onclick) để biết cách sử dụng onClick thay vì setCustomId.

## Type Definitions

```ts
interface NezonComponentOptions {
  pattern: string;  // Pattern để match button_id
  id?: string;      // Optional: exact ID match
}

type ComponentPayload = MessageButtonClicked;

type ComponentParams = string[] | Record<string, string>;
// Nếu có named parameters: Record<string, string>
// Nếu không: string[]
```

## Best Practices

1. **Sử dụng RESTful pattern cho complex routing**
   ```ts
   @Component({ pattern: '/user/:id/:action' })
   ```

2. **Sử dụng @ComponentTarget() để tránh fetch lại**
   ```ts
   @ComponentTarget() target: Nezon.Message | undefined
   ```

3. **Validate parameters trước khi sử dụng**
   ```ts
   const userId = params?.user_id;
   if (!userId) {
     await message.reply(SmartMessage.text('Invalid user ID!'));
     return;
   }
   ```

## API Reference

### @Component()

```ts
function Component(
  options: NezonComponentOptions | string
): MethodDecorator
```

### @ComponentPayload()

```ts
function ComponentPayload(): ParameterDecorator
// Trả về: Nezon.ComponentPayload = MessageButtonClicked
```

### @ComponentParams()

```ts
function ComponentParams(paramName?: string): ParameterDecorator
// Không có paramName: trả về tất cả params
// Có paramName: trả về param cụ thể
// Trả về: Nezon.ComponentParams = string[] | Record<string, string>
```

### @ComponentParam()

```ts
function ComponentParam(positionOrName: number | string): ParameterDecorator
// number: lấy theo index
// string: lấy theo tên (named parameter)
// Trả về: string | undefined
```

### @ComponentTarget()

```ts
function ComponentTarget(): ParameterDecorator
// Trả về: Nezon.Message | undefined
```

## Xem thêm

- [onClick Handlers](/docs/interaction/onclick) - Inline button handlers
- [@Command](/docs/interaction/command) - Text commands
- [@On, @Once](/docs/interaction/events) - Event listeners

