---
id: text-message
title: Text Message
sidebar_position: 1
---

Hướng dẫn tạo text message và system message với SmartMessage builder.

## Text Message

Text message là loại message cơ bản nhất, chỉ chứa text thuần túy.

### Cú pháp

```ts
SmartMessage.text(content: string): SmartMessage
```

### Ví dụ cơ bản

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('hello')
async onHello(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(SmartMessage.text('Hello, World!'));
}
```

### Type

```ts
SmartMessage.text('Hello')
// Trả về: SmartMessage instance
// Có thể truyền vào: message.reply(), message.update()
```

### Tương đương với Mezon SDK

```ts
// Với Nezon
await message.reply(SmartMessage.text('Hello'));

// Với Mezon SDK (thủ công)
await message.reply({ t: 'Hello' });
```

## System Message

System message sử dụng markdown triple (`EMarkdownType.PRE`) để hiển thị nội dung trong khung đặc biệt, thường dùng cho thông báo hệ thống.

![System Message Example](/img/system.png)

### Cú pháp

```ts
SmartMessage.system(content: string): SmartMessage
```

### Ví dụ

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('announce')
async onAnnounce(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.system('⚠️ Thông báo quan trọng!\n\nBot sẽ bảo trì vào 2h sáng.')
  );
}
```

### Type

```ts
SmartMessage.system('Content')
// Trả về: SmartMessage instance
// Nội dung sẽ được wrap trong markdown triple
```

### Tương đương với Mezon SDK

```ts
// Với Nezon
await message.reply(SmartMessage.system('Content'));
 

## Kết hợp với các tính năng khác

### Text message với buttons

```ts
import { Command, AutoContext, SmartMessage, ButtonBuilder, ButtonStyle } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('menu')
async onMenu(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Chọn một tùy chọn:')
      .addButton(
        new ButtonBuilder()
          .setLabel('Option 1')
          .setStyle(ButtonStyle.Primary)
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Option 2')
          .setStyle(ButtonStyle.Secondary)
      )
  );
}
```

### System message với embed

```ts
import { Command, AutoContext, SmartMessage, EmbedBuilder } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('notice')
async onNotice(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.system('Thông báo hệ thống')
      .addEmbed(
        new EmbedBuilder()
          .setTitle('Cập nhật mới')
          .setDescription('Phiên bản 0.0.7 đã được phát hành!')
          .setColor('#00ff00')
      )
  );
}
```

## So sánh Text vs System

| Tính năng | Text Message | System Message |
|-----------|--------------|----------------|
| Markdown | Không | Triple markdown |
| Hiển thị | Text thường | Khung đặc biệt |
| Use case | Tin nhắn thông thường | Thông báo hệ thống |
| Cú pháp | `SmartMessage.text()` | `SmartMessage.system()` |

## Best Practices

1. **Sử dụng Text cho tin nhắn thông thường**
   ```ts
   SmartMessage.text('Hello!')
   ```

2. **Sử dụng System cho thông báo quan trọng**
   ```ts
   SmartMessage.system('⚠️ Cảnh báo!')
   ```

3. **Kết hợp với buttons/embeds khi cần**
   ```ts
   SmartMessage.text('Menu')
     .addButton(...)
     .addEmbed(...)
   ```

## API Reference

### SmartMessage.text()

**Signature:**
```ts
static text(content: string): SmartMessage
```

**Parameters:**
- `content: string` - Nội dung text message

**Returns:**
- `SmartMessage` - Instance có thể chain với `.addButton()`, `.addEmbed()`, etc.

### SmartMessage.system()

**Signature:**
```ts
static system(content: string): SmartMessage
```

**Parameters:**
- `content: string` - Nội dung system message

**Returns:**
- `SmartMessage` - Instance có thể chain với `.addButton()`, `.addEmbed()`, etc.

## Xem thêm

- [Attachments](/docs/message-template/attachments) - Tìm hiểu về attachments
- [Embed, Form, Button](/docs/message-template/embed-form-button) - Tìm hiểu về embeds và forms

