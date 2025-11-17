---
title: Tổng Quan Message Builder
sidebar_position: 1
description: Lộ trình xây dựng nội dung với SmartMessage, Text, Attachments, Embed/Form/Button và DM.
---

# Tổng Quan Message Builder

`Nezon.SmartMessage` giúp bạn dựng mọi loại nội dung gửi tới Mezon (text, ảnh, file, embed, form, button...). Các trang con trong mục **Message Builder** đi sâu vào từng loại, nhưng trước hết hãy điểm qua những khả năng chính:

| Chủ đề                                  | Trang chi tiết                                  |
| --------------------------------------- | ----------------------------------------------- |
| Văn bản, markdown, mention              | [Text Message](./text-message.md)               |
| Ảnh, file, audio, GIF                   | [Attachments](./attachments.md)                 |
| Embed, Form input, Button/Dropdown      | [Embed / Form / Button](./embed-form-button.md) |
| Gửi DM, DMHelper, ManagedMessage.sendDM | [DM Message](./dm.md)                           |

## Mention user hoặc role

1. Trong nội dung message đặt placeholder `{{placeholder_name}}` tại vị trí cần mention.
2. Sử dụng `SmartMessage.addMention('placeholder_name', 'USER_ID')` để mention user theo ID hoặc truyền object `{ user_id, username? }`.
3. Để mention role, truyền `{ role_id: 'ROLE_ID' }` hoặc `{ role_name: 'Tên Role' }`. SDK sẽ tìm role tương ứng để render `@Role`.
4. `SmartMessage` tự động chèn `mentions` array với vị trí (`s`, `e`) chính xác và thay thế placeholder bằng tên người dùng hoặc role.

Xem chi tiết API: [SmartMessage → .addMention](./smart-message.md#addmention).

## Ví dụ nhanh

```ts
import {
  Command,
  AutoContext,
  SmartMessage,
  ButtonBuilder,
  ButtonStyle,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Command("demo")
export class DemoCommand {
  async execute(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
      SmartMessage.text("Chọn hành động:")
        .addImage("https://picsum.photos/400/200", { filename: "banner.jpg" })
        .addEmbed(
          new Nezon.EmbedBuilder()
            .setTitle("Survey")
            .setDescription("Bạn thích tính năng nào nhất?")
            .addTextField("Ý kiến", "feedback", {
              placeholder: "Ghi ý kiến ở đây",
            })
        )
        .addButton(
          new ButtonBuilder()
            .setLabel("Gửi phản hồi")
            .setStyle(ButtonStyle.Success)
            .setCustomId("/feedback/submit")
        )
    );
  }
}
```

Form `feedback` sẽ xuất hiện dưới embed. Khi người dùng bấm nút `/feedback/submit`, bạn có thể đọc lại dữ liệu bằng `@FormData('feedback')` trong component/onClick handler.

## SmartMessage cơ bản

- `SmartMessage.text()` – gửi tin nhắn thường.
- `SmartMessage.system()` – bao bọc nội dung kiểu block code.
- `SmartMessage.build()` – tạo message rỗng rồi gắn embed/button/attachments.
- `SmartMessage.addGIF(url)` – thêm GIF (filetype `image/gif`).

Các method khác:

| Method                                          | Mô tả                                             |
| ----------------------------------------------- | ------------------------------------------------- |
| `.addButton(builder)`                           | Thêm button hoặc dropdown (khi builder là select) |
| `.addEmbed(builder)`                            | Thêm embed (kết hợp form inputs)                  |
| `.addImage(url)` / `.addFile()` / `.addVoice()` | Thêm attachments                                  |
| `.addMention(...)`                              | Tạo placeholder để mention user/role với form mới |

Chi tiết: xem từng trang ở bảng đầu trang.

## Luồng gợi ý

1. **Text & mention** – trang [Text Message](./text-message.md) giải thích `SmartMessage.system`, markdown, `addMention`.
2. **Media** – trang [Attachments](./attachments.md) mô tả `addImage`, `addFile`, `addVoice`, `addGIF`.
3. **Interactive embed** – trang [Embed / Form / Button](./embed-form-button.md) hướng dẫn `EmbedBuilder`, form input, button.
4. **DM** – trang [DM Message](./dm.md) mô tả `DMHelper` và `ManagedMessage.sendDM`.

Sau khi build message, xem [Gửi tin nhắn](../messaging/send-message.md) để biết nên dùng ManagedMessage, ChannelHelper hay DMHelper tuỳ ngữ cảnh.
