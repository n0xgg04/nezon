---
id: utils
title: NezonUtils - Utility Service
sidebar_position: 1
---

`NezonUtilsService` (hay còn gọi là `nezonSmartUtils`) là một service tiện ích cung cấp các helper methods để tương tác với Mezon SDK một cách dễ dàng và an toàn. Service này được inject tự động vào các command handlers, component handlers, và event handlers thông qua decorator `@NezonUtils()`.

## Tổng quan

`NezonUtilsService` cung cấp các phương thức tiện ích để:

- **Lấy entities**: Fetch clan, channel, message từ Mezon SDK với error handling tự động
- **Gửi token**: Gửi token cho người dùng một cách dễ dàng
- **Cache management**: Tự động sử dụng cache khi có thể để tối ưu performance

## Cách sử dụng

### Inject NezonUtilsService

Sử dụng decorator `@NezonUtils()` để inject service vào handler:

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

### Inject qua Constructor (NestJS Dependency Injection)

Bạn cũng có thể inject `NezonUtilsService` qua constructor của class:

```ts
import { Injectable } from '@nestjs/common';
import { NezonUtilsService } from '@n0xgg04/nezon';
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class MyHandlers {
  constructor(private readonly utils: NezonUtilsService) {}

  @Command('test')
  async onTest(@AutoContext() [message]: Nezon.AutoContext) {
    const channel = await this.utils.getChannel(message.channelId!);
    await message.reply(
      SmartMessage.text(`Channel ID: ${channel?.id ?? 'unknown'}`)
    );
  }
}
```

## API Reference

### `getClan(id: string): Promise<Clan | undefined>`

Lấy clan entity từ Mezon SDK. Tự động kiểm tra cache trước khi fetch.

**Parameters:**
- `id: string` - Clan ID cần lấy

**Returns:**
- `Promise<Clan | undefined>` - Clan entity hoặc `undefined` nếu không tìm thấy hoặc có lỗi

**Ví dụ:**
```ts
@Command('clan')
async onClan(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const clanId = args[0];
  if (!clanId) {
    await message.reply(SmartMessage.text('Sử dụng: *clan <clan_id>'));
    return;
  }

  const clan = await utils.getClan(clanId);
  if (clan) {
    await message.reply(
      SmartMessage.text(`Clan: ${clan.name}\nID: ${clan.id}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Không tìm thấy clan với ID: ${clanId}`)
    );
  }
}
```

**Lưu ý:**
- Method này tự động log warning nếu có lỗi xảy ra
- Kiểm tra cache trước khi fetch để tối ưu performance
- Trả về `undefined` thay vì throw error để code dễ xử lý

### `getChannel(id: string): Promise<TextChannel | undefined>`

Lấy channel entity từ Mezon SDK.

**Parameters:**
- `id: string` - Channel ID cần lấy

**Returns:**
- `Promise<TextChannel | undefined>` - Channel entity hoặc `undefined` nếu không tìm thấy hoặc có lỗi

**Ví dụ:**
```ts
@Command('channel')
async onChannel(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const channelId = args[0] || message.channelId;
  
  if (!channelId) {
    await message.reply(SmartMessage.text('Không có channel ID'));
    return;
  }

  const channel = await utils.getChannel(channelId);
  if (channel) {
    await message.reply(
      SmartMessage.text(`Channel: ${channel.name}\nID: ${channel.id}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Không tìm thấy channel với ID: ${channelId}`)
    );
  }
}
```

**Lưu ý:**
- Method này tự động log warning nếu có lỗi xảy ra
- Trả về `undefined` thay vì throw error

### `getMessage(id: string, channelId?: string): Promise<Message | undefined>`

Lấy message entity từ Mezon SDK. Có thể tìm trong một channel cụ thể hoặc tìm trong tất cả channels.

**Parameters:**
- `id: string` - Message ID cần lấy
- `channelId?: string` - (Optional) Channel ID để tìm message trong channel đó. Nếu không cung cấp, sẽ tìm trong tất cả channels.

**Returns:**
- `Promise<Message | undefined>` - Message entity hoặc `undefined` nếu không tìm thấy hoặc có lỗi

**Ví dụ 1: Tìm message trong channel cụ thể**
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
    await message.reply(SmartMessage.text('Sử dụng: *message <message_id> [channel_id]'));
    return;
  }

  const msg = await utils.getMessage(messageId, channelId);
  if (msg) {
    await message.reply(
      SmartMessage.text(`Message ID: ${msg.id}\nContent: ${msg.content?.t ?? 'N/A'}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Không tìm thấy message với ID: ${messageId}`)
    );
  }
}
```

**Ví dụ 2: Tìm message trong tất cả channels**
```ts
@Command('find-message')
async onFindMessage(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  if (!messageId) {
    await message.reply(SmartMessage.text('Sử dụng: *find-message <message_id>'));
    return;
  }

  const msg = await utils.getMessage(messageId);
  if (msg) {
    await message.reply(
      SmartMessage.text(`Tìm thấy message:\nID: ${msg.id}\nChannel: ${msg.channel_id}`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`Không tìm thấy message với ID: ${messageId}`)
    );
  }
}
```

**Lưu ý:**
- Nếu không cung cấp `channelId`, method sẽ tìm trong tất cả channels (có thể chậm)
- Nên cung cấp `channelId` khi biết chắc channel để tối ưu performance
- Method này tự động log warning nếu có lỗi xảy ra
- Trả về `undefined` thay vì throw error

### `getManagedMessage(id: string, channelId?: string): Promise<ManagedMessage | undefined>`

Lấy message entity và wrap trong `ManagedMessage` để sử dụng các helper methods như `reply()`, `update()`, `delete()`, `react()`, etc.

**Parameters:**
- `id: string` - Message ID cần lấy
- `channelId?: string` - (Optional) Channel ID chứa message. Nếu không cung cấp, sẽ tìm trong tất cả channels

**Returns:**
- `Promise<ManagedMessage | undefined>` - ManagedMessage instance hoặc `undefined` nếu không tìm thấy

**Ví dụ:**
```ts
@Command('react-message')
async onReactMessage(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  if (!messageId) {
    await message.reply(SmartMessage.text('Sử dụng: *react-message <message_id>'));
    return;
  }

  const managedMsg = await utils.getManagedMessage(messageId, message.channelId);
  if (managedMsg) {
    await managedMsg.addReaction('👍');
    await managedMsg.reply(SmartMessage.text('Đã react!'));
  } else {
    await message.reply(SmartMessage.text('Không tìm thấy message'));
  }
}
```

**Ví dụ với update và delete:**
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
    await message.reply(SmartMessage.text('Sử dụng: *edit-message <message_id> <new_text>'));
    return;
  }

  const managedMsg = await utils.getManagedMessage(messageId, message.channelId);
  if (managedMsg) {
    try {
      await managedMsg.update(SmartMessage.text(newText));
      await message.reply(SmartMessage.text('✅ Đã cập nhật message'));
    } catch (error) {
      await message.reply(SmartMessage.text('❌ Không thể cập nhật message (chỉ có thể update message của bot)'));
    }
  }
}
```

**Lưu ý:**
- `ManagedMessage` cung cấp các methods: `reply()`, `update()`, `delete()`, `react()`, `addReaction()`, `removeReaction()`, `sendDM()`, `fetch()`
- `update()` và `delete()` chỉ hoạt động với message của bot (sẽ throw error nếu không phải)
- `react()` hoạt động với cả message của user và bot
- Nên cung cấp `channelId` để tối ưu performance

### `sendToken(recipientId: string, amount: number, note?: string): Promise<{ ok: boolean; tx_hash: string; error: string } | undefined>`

Gửi token cho một người dùng.

**Parameters:**
- `recipientId: string` - User ID của người nhận
- `amount: number` - Số lượng token cần gửi
- `note?: string` - (Optional) Ghi chú kèm theo transaction

**Returns:**
- `Promise<{ ok: boolean; tx_hash: string; error: string } | undefined>` - Kết quả transaction hoặc `undefined` nếu có lỗi

**Response Structure:**
```ts
{
  ok: boolean;        // true nếu thành công, false nếu thất bại
  tx_hash: string;   // Transaction hash
  error: string;      // Thông báo lỗi (nếu có)
}
```

**Ví dụ:**
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
      SmartMessage.text('Sử dụng: *send-token <user_id> <amount> [note]')
    );
    return;
  }

  const note = args.slice(2).join(' ') || undefined;
  const result = await utils.sendToken(recipientId, amount, note);

  if (result) {
    if (result.ok) {
      await message.reply(
        SmartMessage.text(
          `✅ Đã gửi ${amount} token đến ${recipientId}\n` +
          `Transaction hash: ${result.tx_hash}`
        )
      );
    } else {
      await message.reply(
        SmartMessage.text(`❌ Lỗi: ${result.error}`)
      );
    }
  } else {
    await message.reply(
      SmartMessage.text('❌ Không thể gửi token. Vui lòng thử lại sau.')
    );
  }
}
```

**Ví dụ với note:**
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
    await message.reply(SmartMessage.text('Sử dụng: *tip <amount>'));
    return;
  }

  const result = await utils.sendToken(
    user.id,
    amount,
    `Tip từ ${message.raw.sender_id}`
  );

  if (result?.ok) {
    await message.reply(
      SmartMessage.text(`✅ Đã tip ${amount} token cho ${user.display_name}!`)
    );
  } else {
    await message.reply(
      SmartMessage.text(`❌ Lỗi khi gửi tip: ${result?.error ?? 'Unknown error'}`)
    );
  }
}
```

**Lưu ý:**
- Method này yêu cầu bot có quyền gửi token
- Tự động log warning nếu có lỗi xảy ra
- Trả về `undefined` nếu `client.sendToken` không tồn tại hoặc có lỗi

## Ví dụ thực tế

### Ví dụ 1: Lấy thông tin clan và channel

```ts
@Command('server-info')
async onServerInfo(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Channel() channel: Nezon.Channel | undefined,
  @Clan() clan: Nezon.Clan | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  if (!channel) {
    await message.reply(SmartMessage.text('Không thể lấy thông tin channel'));
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Server Information')
    .addField('Channel', `${channel.name} (${channel.id})`, true)
    .addField('Channel Type', channel.type ?? 'N/A', true);

  if (clan) {
    embed
      .addField('Clan', `${clan.name} (${clan.id})`, true)
      .addField('Clan Members', clan.member_count?.toString() ?? 'N/A', true);
  }

  await message.reply(
    SmartMessage.text('Thông tin server:')
      .addEmbed(embed)
  );
}
```

### Ví dụ 2: Tìm và hiển thị message

```ts
@Command('quote')
async onQuote(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const messageId = args[0];
  if (!messageId) {
    await message.reply(SmartMessage.text('Sử dụng: *quote <message_id>'));
    return;
  }

  const msg = await utils.getMessage(messageId, message.channelId);
  if (!msg) {
    await message.reply(
      SmartMessage.text(`Không tìm thấy message với ID: ${messageId}`)
    );
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Quoted Message')
    .setDescription(msg.content?.t ?? 'No content')
    .addField('Author', msg.sender_id ?? 'Unknown', true)
    .addField('Message ID', msg.id, true)
    .addField('Channel ID', msg.channel_id ?? 'N/A', true);

  if (msg.created_at) {
    embed.addField('Created At', new Date(msg.created_at).toLocaleString(), true);
  }

  await message.reply(
    SmartMessage.text('')
      .addEmbed(embed)
  );
}
```

### Ví dụ 3: Gửi token với validation

```ts
@Command('reward')
async onReward(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @User() user: Nezon.User | undefined,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  if (!user) {
    await message.reply(SmartMessage.text('Không thể lấy thông tin user'));
    return;
  }

  const amount = parseFloat(args[0]);
  if (isNaN(amount) || amount <= 0) {
    await message.reply(SmartMessage.text('Sử dụng: *reward <amount>'));
    return;
  }

  if (amount > 1000) {
    await message.reply(
      SmartMessage.text('⚠️ Số lượng token tối đa là 1000')
    );
    return;
  }

  const result = await utils.sendToken(
    user.id,
    amount,
    `Reward từ bot - ${new Date().toLocaleString()}`
  );

  if (result?.ok) {
    await message.reply(
      SmartMessage.text(
        `✅ Đã thưởng ${amount} token cho ${user.display_name}!\n` +
        `Transaction: ${result.tx_hash}`
      )
    );
  } else {
    await message.reply(
      SmartMessage.text(`❌ Lỗi: ${result?.error ?? 'Unknown error'}`)
    );
  }
}
```

### Ví dụ 4: Kết hợp nhiều methods

```ts
@Command('transfer')
async onTransfer(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Args() args: Nezon.Args,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  const recipientId = args[0];
  const amount = parseFloat(args[1]);
  const channelId = args[2];

  if (!recipientId || isNaN(amount) || amount <= 0) {
    await message.reply(
      SmartMessage.text('Sử dụng: *transfer <user_id> <amount> [channel_id]')
    );
    return;
  }

  const channel = channelId 
    ? await utils.getChannel(channelId)
    : await utils.getChannel(message.channelId!);

  if (!channel) {
    await message.reply(SmartMessage.text('Không tìm thấy channel'));
    return;
  }

  const result = await utils.sendToken(
    recipientId,
    amount,
    `Transfer từ channel ${channel.name}`
  );

  if (result?.ok) {
    await message.reply(
      SmartMessage.text(
        `✅ Đã chuyển ${amount} token đến ${recipientId}\n` +
        `Channel: ${channel.name}\n` +
        `Transaction: ${result.tx_hash}`
      )
    );
  } else {
    await message.reply(
      SmartMessage.text(`❌ Lỗi: ${result?.error ?? 'Unknown error'}`)
    );
  }
}
```

## Best Practices

### 1. Luôn kiểm tra kết quả

Tất cả methods của `NezonUtilsService` đều có thể trả về `undefined`. Luôn kiểm tra trước khi sử dụng:

```ts
const channel = await utils.getChannel(channelId);
if (!channel) {
  await message.reply(SmartMessage.text('Không tìm thấy channel'));
  return;
}
```

### 2. Sử dụng với error handling

```ts
try {
  const clan = await utils.getClan(clanId);
  if (clan) {
    await message.reply(SmartMessage.text(`Clan: ${clan.name}`));
  }
} catch (error) {
  this.logger.error('Failed to get clan', error);
  await message.reply(SmartMessage.text('Có lỗi xảy ra'));
}
```

### 3. Tối ưu performance với channelId

Khi tìm message, luôn cung cấp `channelId` nếu có thể:

```ts
const msg = await utils.getMessage(messageId, channelId);
```

### 4. Validate input trước khi gửi token

```ts
const amount = parseFloat(args[0]);
if (isNaN(amount) || amount <= 0) {
  await message.reply(SmartMessage.text('Số lượng không hợp lệ'));
  return;
}
```

### 5. Sử dụng với decorators khác

Kết hợp `@NezonUtils()` với các decorators khác để code gọn gàng hơn:

```ts
@Command('info')
async onInfo(
  @NezonUtils() utils: Nezon.NezonUtilsService,
  @Channel() channel: Nezon.Channel | undefined,
  @User() user: Nezon.User | undefined,
  @AutoContext() [message]: Nezon.AutoContext,
) {
  if (!channel || !user) {
    await message.reply(SmartMessage.text('Thiếu thông tin'));
    return;
  }
}
```

## So sánh với Mezon SDK thuần

| Tính năng | NezonUtilsService | Mezon SDK thuần |
|-----------|-------------------|-----------------|
| Error Handling | ✅ Tự động log và trả về undefined | ⚠️ Phải tự xử lý try-catch |
| Cache | ✅ Tự động sử dụng cache | ⚠️ Phải tự quản lý cache |
| Type Safety | ✅ Full TypeScript support | ⚠️ Manual typing |
| Code Clarity | ✅ Methods rõ ràng, dễ đọc | ⚠️ Phải biết API structure |
| Null Safety | ✅ Trả về undefined thay vì throw | ⚠️ Có thể throw error |

## Type Reference

```ts
import type { Nezon } from '@n0xgg04/nezon';

@NezonUtils() utils: Nezon.NezonUtilsService
```

Hoặc import trực tiếp:

```ts
import { NezonUtilsService } from '@n0xgg04/nezon';

constructor(private readonly utils: NezonUtilsService) {}
```

## Xem thêm

- [Command Decorators](/docs/interaction/command) - Cách sử dụng decorators trong commands
- [Component Decorators](/docs/interaction/component) - Cách sử dụng decorators trong components
- [Event Handlers](/docs/interaction/events) - Cách xử lý events
- [Decorators Reference](/docs/decorators) - Tổng quan về tất cả decorators

