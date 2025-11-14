---
id: onclick
title: onClick & setCustomId
sidebar_position: 4
---

Hướng dẫn sử dụng `onClick()` và `setCustomId()` trong ButtonBuilder để xử lý button clicks.

## Tổng quan

ButtonBuilder cung cấp hai cách để xử lý button clicks:
1. **`setCustomId()`** - Set custom ID và xử lý bằng `@Component` decorator
2. **`onClick()`** - Inline handler tự động đăng ký (khuyến nghị)

![Button Example](/img/button.png)

## setCustomId()

Set custom ID cho button và xử lý bằng `@Component` decorator.

### Cú pháp

```ts
setCustomId(customId: string): ButtonBuilder
```

### Ví dụ

```ts
import { Command, AutoContext, SmartMessage, ButtonBuilder, ButtonStyle } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('button')
async onButton(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Click the button!')
      .addButton(
        new ButtonBuilder()
          .setCustomId('click/confirm')
          .setLabel('Confirm')
          .setStyle(ButtonStyle.Success)
      )
  );
}

@Component({ pattern: 'click/confirm' })
async onConfirm(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(SmartMessage.text('Confirmed!'));
}
```

### Với Named Parameters

```ts
@Command('button')
async onButton(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  const messageId = managedMessage.id ?? 'unknown';
  await managedMessage.reply(
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
  @AutoContext() [managedMessage]: Nezon.AutoContext,
) {
  await managedMessage.reply(SmartMessage.text(`Confirmed! ID: ${targetId}`));
}
```

### Type

```ts
setCustomId(customId: string): ButtonBuilder
// Throws error nếu onClick() đã được set
```

## onClick() (Khuyến nghị)

Set inline click handler, tự động generate ID và đăng ký handler.

### Cú pháp

```ts
onClick(handler: ButtonClickHandler): ButtonBuilder
```

### Ví dụ cơ bản

```ts
import { Command, AutoContext, SmartMessage, ButtonBuilder, ButtonStyle } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('button')
async onButton(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Click the button!')
      .addButton(
        new ButtonBuilder()
          .setLabel('Click Me')
          .setStyle(ButtonStyle.Primary)
          .onClick(async (context) => {
            await context.message.reply(SmartMessage.text('Button clicked!'));
          })
      )
  );
}
```

### ButtonClickContext

Handler nhận `ButtonClickContext` với các entities đã được resolve sẵn:

```ts
interface ButtonClickContext {
  message: ManagedMessage;        // ✅ Đã resolve
  channel: TextChannel | undefined; // ✅ Đã resolve
  user: User | undefined;         // ✅ Đã resolve
  clan: Clan | undefined;         // ✅ Đã resolve
  client: MezonClient;            // ✅ Đã resolve
}
```

### Ví dụ với Context

```ts
@Command('button')
async onButton(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Click the button!')
      .addButton(
        new ButtonBuilder()
          .setLabel('Get Info')
          .setStyle(ButtonStyle.Info)
          .onClick(async ({ message, channel, user, clan }) => {
            const channelName = channel?.name ?? 'unknown';
            const userName = user?.username ?? 'unknown';
            const clanName = clan?.name ?? 'unknown';
            
            await message.reply(
              SmartMessage.text(
                `User: ${userName}\nChannel: ${channelName}\nClan: ${clanName}`
              )
            );
          })
      )
  );
}
```

### Nhiều Buttons với onClick

```ts
@Command('menu')
async onMenu(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Choose an option:')
      .addButton(
        new ButtonBuilder()
          .setLabel('Option 1')
          .setStyle(ButtonStyle.Primary)
          .onClick(async (context) => {
            await context.message.reply(SmartMessage.text('Option 1 selected!'));
          })
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Option 2')
          .setStyle(ButtonStyle.Success)
          .onClick(async (context) => {
            await context.message.reply(SmartMessage.text('Option 2 selected!'));
          })
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Option 3')
          .setStyle(ButtonStyle.Danger)
          .onClick(async (context) => {
            await context.message.reply(SmartMessage.text('Option 3 selected!'));
          })
      )
  );
}
```

## So sánh setCustomId vs onClick

| Tính năng | setCustomId | onClick |
|-----------|-------------|---------|
| ID generation | Manual | Auto (UUID) |
| Handler location | Separate `@Component` | Inline |
| Context resolution | Manual | Auto |
| Type safety | Good | Excellent |
| Code organization | Scattered | Co-located |
| Recommended | ❌ | ✅ |

## Validation

ButtonBuilder không cho phép dùng cả `setCustomId()` và `onClick()` cùng lúc:

```ts
// ❌ Sẽ throw error
new ButtonBuilder()
  .setCustomId('click/confirm')
  .onClick(async () => {}) // Error!

// ❌ Sẽ throw error
new ButtonBuilder()
  .onClick(async () => {})
  .setCustomId('click/confirm') // Error!
```

## Type Definitions

```ts
type ButtonClickHandler = (
  context: ButtonClickContext
) => Promise<void> | void;

interface ButtonClickContext {
  message: ManagedMessage;
  channel: TextChannel | undefined;
  user: User | undefined;
  clan: Clan | undefined;
  client: MezonClient;
}
```

## Best Practices

1. **Ưu tiên sử dụng onClick()**
   ```ts
   .onClick(async (context) => {
     // Handler code
   })
   ```

2. **Sử dụng context đã resolve**
   ```ts
   .onClick(async ({ message, channel, user }) => {
     // Không cần fetch lại
   })
   ```

3. **Sử dụng setCustomId() khi cần pattern matching**
   ```ts
   .setCustomId('/user/:id/:action')
   // Với @Component({ pattern: '/user/:id/:action' })
   ```

## API Reference

### setCustomId()

```ts
setCustomId(customId: string): ButtonBuilder
// Throws: Error nếu onClick() đã được set
```

### onClick()

```ts
onClick(handler: ButtonClickHandler): ButtonBuilder
// Throws: Error nếu setCustomId() đã được set
// Auto-generates: Unique ID với crypto.randomUUID()
```

## Xem thêm

- [@Component](/docs/interaction/component) - Component handlers với setCustomId
- [ButtonBuilder](/docs/message-template/embed-form-button) - ButtonBuilder API
- [Examples](/docs/examples) - Ví dụ chi tiết

