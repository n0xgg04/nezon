---
id: dm
title: Direct Message (DM)
sidebar_position: 4
---

Hướng dẫn gửi Direct Message (DM) cho người dùng với Nezon.

## Tổng quan

Nezon hỗ trợ gửi DM cho người dùng thông qua 2 cách:
1. **DMHelper** - Gửi DM đến user cụ thể bằng `user_id`
2. **ManagedMessage.sendDM()** - Gửi DM tự động cho người gửi tin nhắn hiện tại

## Cách 1: Sử dụng DMHelper

Sử dụng `DMHelper` từ `AutoContext` để gửi DM đến bất kỳ user nào.

### Cú pháp

```ts
@AutoContext() [message, dm]: Nezon.AutoContext
await dm.send(userId: string, message: SmartMessageLike)
```

### Ví dụ cơ bản

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('dm')
async onDM(
  @Args() args: Nezon.Args,
  @AutoContext() [message, dm]: Nezon.AutoContext,
) {
  const targetUserId = args[0];
  
  if (!targetUserId) {
    await message.reply(
      SmartMessage.text('Sử dụng: *dm <user_id>'),
    );
    return;
  }

  try {
    await dm.send(
      targetUserId,
      SmartMessage.text('Đây là tin nhắn DM được gửi từ bot!'),
    );
    await message.reply(
      SmartMessage.text(`✅ Đã gửi DM đến user ${targetUserId}`),
    );
  } catch (error) {
    await message.reply(
      SmartMessage.text(`❌ Lỗi: ${(error as Error).message}`),
    );
  }
}
```

**Sử dụng:** `*dm <user_id>` → Bot gửi DM đến user đó

### Type

```ts
type AutoContext = [ManagedMessage, DMHelper];

interface DMHelper {
  send(userId: string, message: SmartMessageLike): Promise<ChannelMessageAck>;
}
```

### DM với SmartMessage đầy đủ

```ts
@Command('dm-rich')
async onDMRich(
  @Args() args: Nezon.Args,
  @AutoContext() [message, dm]: Nezon.AutoContext,
) {
  const targetUserId = args[0];
  
  if (!targetUserId) {
    await message.reply(SmartMessage.text('Sử dụng: *dm-rich <user_id>'));
    return;
  }

  await dm.send(
    targetUserId,
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

## Cách 2: Sử dụng message.sendDM()

Sử dụng `sendDM()` từ `ManagedMessage` để tự động gửi DM cho người gửi tin nhắn hiện tại.

### Cú pháp

```ts
await message.sendDM(message: SmartMessageLike)
```

### Ví dụ cơ bản

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('senddm')
async onSendDM(@AutoContext() [message]: Nezon.AutoContext) {
  try {
    await message.sendDM(
      SmartMessage.text('Đây là tin nhắn DM được gửi tự động cho bạn!'),
    );
    await message.reply(
      SmartMessage.text('✅ Đã gửi DM cho bạn!'),
    );
  } catch (error) {
    await message.reply(
      SmartMessage.text(`❌ Lỗi: ${(error as Error).message}`),
    );
  }
}
```

**Sử dụng:** `*senddm` → Bot gửi DM cho người gửi command

### Type

```ts
interface ManagedMessage {
  sendDM(message: SmartMessageLike): Promise<ChannelMessageAck>;
}
```

### sendDM với attachments

```ts
@Command('senddm-file')
async onSendDMFile(@AutoContext() [message]: Nezon.AutoContext) {
  await message.sendDM(
    SmartMessage.text('DM với file đính kèm!')
      .addFile(
        'https://example.com/file.pdf',
        'document.pdf',
        'application/pdf',
        { size: 1024000 },
      ),
  );
}
```

## So sánh 2 cách

| Tính năng | DMHelper | message.sendDM() |
|-----------|----------|------------------|
| Gửi đến user cụ thể | ✅ Có (cần `user_id`) | ❌ Chỉ gửi cho sender |
| Tự động lấy sender | ❌ | ✅ |
| Cần AutoContext đầy đủ | ✅ `[message, dm]` | ✅ Chỉ `[message]` |
| Use case | Gửi DM cho user khác | Phản hồi DM cho người gửi |

## Ví dụ thực tế

### Gửi thông báo riêng tư

```ts
@Command('notify')
async onNotify(
  @Args() args: Nezon.Args,
  @AutoContext() [message, dm]: Nezon.AutoContext,
  @User() user?: Nezon.User,
) {
  const targetUserId = args[0];
  const notification = args.slice(1).join(' ') || 'Bạn có thông báo mới!';
  
  if (!targetUserId) {
    await message.reply(
      SmartMessage.text('Sử dụng: *notify <user_id> <message>'),
    );
    return;
  }

  try {
    await dm.send(
      targetUserId,
      SmartMessage.system(`🔔 Thông báo từ ${user?.username || 'Bot'}:\n\n${notification}`),
    );
    await message.reply(
      SmartMessage.text(`✅ Đã gửi thông báo đến ${targetUserId}`),
    );
  } catch (error) {
    await message.reply(
      SmartMessage.text(`❌ Không thể gửi DM: ${(error as Error).message}`),
    );
  }
}
```

### Phản hồi riêng tư

```ts
@Command('private')
async onPrivate(
  @AutoContext() [message]: Nezon.AutoContext,
  @Args() args: Nezon.Args,
) {
  const response = args.join(' ') || 'Đây là phản hồi riêng tư!';
  
  await message.sendDM(
    SmartMessage.text(response),
  );
  
  await message.reply(
    SmartMessage.system('✅ Đã gửi phản hồi riêng tư cho bạn!'),
  );
}
```

## Lưu ý

1. **DM Channel**: Nezon tự động tạo DM channel nếu chưa tồn tại
2. **Error Handling**: Luôn bắt lỗi khi gửi DM vì có thể user không cho phép nhận DM
3. **Rate Limiting**: Mezon có giới hạn số lượng DM có thể gửi, cần xử lý rate limiting nếu gửi nhiều
4. **User ID**: Cần có `user_id` hợp lệ để gửi DM

## Troubleshooting

### Lỗi: "Failed to create DM channel"

- Kiểm tra `user_id` có đúng không
- Đảm bảo bot có quyền gửi DM
- User có thể đã chặn bot

### Lỗi: "Failed to fetch DM channel"

- DM channel có thể chưa được tạo thành công
- Kiểm tra kết nối với Mezon API

### DM không được gửi

- Kiểm tra bot đã login chưa
- Kiểm tra `user_id` có tồn tại không
- User có thể đã tắt nhận DM từ bot

## Next Steps

- [Text Message](/docs/message-template/text-message) - Tìm hiểu về text message
- [Attachments](/docs/message-template/attachments) - Gửi file, hình ảnh trong DM
- [Embed & Button](/docs/message-template/embed-form-button) - Tạo DM với embed và button

