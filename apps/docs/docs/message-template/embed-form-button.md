---
title: Embed, Form, Button
sidebar_position: 3
---

Hướng dẫn sử dụng `EmbedBuilder` để tạo rich message, form input và các hiệu ứng đặc biệt (slots/animation).

---

## 1. Quick Start

```ts
import {
  Command,
  AutoContext,
  SmartMessage,
  EmbedBuilder,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('embed')
async function onEmbed(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('').addEmbed(
      new EmbedBuilder()
        .setColor('#7c3aed')
        .setTitle('Example Embed')
        .setDescription('This embed is rendered via EmbedBuilder')
        .setFooter('Powered by Nezon'),
    ),
  );
}
```

---

## 2. Cấu trúc EmbedBuilder

| Thành phần        | Phương thức                                          | Ghi chú                                           |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Màu sắc           | `.setColor('#abcdef')`                               | Hex hoặc tên màu hợp lệ                           |
| Tiêu đề / URL     | `.setTitle() / .setURL()`                            | URL click được gắn vào title                      |
| Author            | `.setAuthor(name, { icon_url, url })`                | Hữu ích khi show avatar hoặc link ngoài           |
| Nội dung          | `.setDescription()` hoặc `.setDescriptionMarkdown()` | Markdown tự động wrap                             |
| Thumbnail / Image | `.setThumbnail(url)` / `.setImage(url)`              | Hỗ trợ preview nhỏ và ảnh lớn                     |
| Footer            | `.setFooter(text, iconUrl?)`                         | Thường dùng để hiển thị nguồn/cập nhật            |
| Timestamp         | `.setTimestamp()`                                    | Không truyền param => mặc định thời điểm hiện tại |

---

## 3. Fields & Media

### `addField(name, value, inline?)`

```ts
new EmbedBuilder()
  .setTitle("User Info")
  .addField("Username", "john_doe", true)
  .addField("Level", "42", true)
  .addField("Status", "Online", true)
  .addField("Description", "Long text...", false);
```

- `inline: true` → hiển thị cùng hàng (tối đa 3 field/line).
- `inline: false` → field chiếm toàn dòng.

### Ảnh minh hoạ

```ts
new EmbedBuilder()
  .setColor("#0ea5e9")
  .setTitle("Rich Embed")
  .setThumbnail("https://example.com/thumb.jpg")
  .addField("Field 1", "Value 1", true)
  .addField("Field 2", "Value 2", true)
  .setImage("https://example.com/hero.jpg")
  .setFooter("Footer text", "https://example.com/footer-icon.png");
```

---

## 4. Form Inputs

Embed hỗ trợ inline forms thông qua `addTextField` và `addSelectField`.

```ts
new EmbedBuilder()
  .setTitle("POLL CREATOR")
  .addTextField("Title", "title", {
    placeholder: "Nhập tiêu đề",
    defaultValue: "",
  })
  .addTextField("Expired Time (hour)", "expired", {
    placeholder: "168",
    defaultValue: 168,
    isNumber: true,
  })
  .addSelectField(
    "Type",
    "type",
    [
      { label: "Single choice", value: "SINGLE" },
      { label: "Multiple choice", value: "MULTIPLE" },
    ],
    "SINGLE"
  );
```

Inputs được client render sẵn, giá trị submit được gửi về component handler/onclick handler tương ứng.

---

## 5. Kết hợp Buttons

```ts
import { ButtonBuilder, ButtonStyle } from "@n0xgg04/nezon";

SmartMessage.text("")
  .addEmbed(
    new EmbedBuilder()
      .setColor("#0ea5e9")
      .setTitle("Action Required")
      .setDescription("Please choose an option")
  )
  .addButton(
    new ButtonBuilder().setLabel("Approve").setStyle(ButtonStyle.Success)
  )
  .addButton(
    new ButtonBuilder().setLabel("Reject").setStyle(ButtonStyle.Danger)
  );
```

Buttons vẫn là component riêng nhưng thường đi kèm embed để tạo UI hoàn chỉnh.

---

## 6. Animated Image / Slots

Để tái hiện hiệu ứng như utility bot (quay → dừng), gửi **2** embed:

```ts
import type { Nezon, NezonUtilsService } from '@n0xgg04/nezon';
import { NezonUtils } from '@n0xgg04/nezon';

@Command('slots')
async function onSlots(
  @AutoContext() [managedMessage]: Nezon.AutoContext,
  @NezonUtils() utils: NezonUtilsService,
) {
  const pool = [
    ['1.png', '2.png', '3.png'],
    ['4.png', '5.png', '6.png'],
    ['7.png', '8.png', '9.png'],
  ];

  // 1) gửi animation quay
  const ack = await managedMessage.reply(
    SmartMessage.text('').addEmbed(
      new EmbedBuilder()
        .setColor('#1F8B4C')
        .setTitle('🎰 Kết quả Slots 🎰')
        .addAnimatedImage({
          id: 'slots',
          imageUrl: 'https://cdn.mezon.ai/.../slots.png',
          positionUrl: 'https://cdn.mezon.ai/.../slots.json',
          pool,
          repeat: 3,
          duration: 0.35,
        }),
    ),
  );

  if (!ack?.message_id || !ack?.channel_id) return;

  // 2) cập nhật embed kết quả sau 1.3s
  setTimeout(async () => {
    const animatedMessage = await utils.getManagedMessage(
      ack.message_id,
      ack.channel_id,
    );
    if (!animatedMessage) return;

    await animatedMessage.update(
      SmartMessage.text('').addEmbed(
        new EmbedBuilder()
          .setColor('#1F8B4C')
          .setTitle('🎰 Kết quả Slots 🎰')
          .addAnimatedImage({
            id: 'slots-result',
            imageUrl: 'https://cdn.mezon.ai/.../slots.png',
            positionUrl: 'https://cdn.mezon.ai/.../slots.json',
            pool,
            repeat: 3,
            duration: 0.35,
            isResult: true,
            extra: {
              jackpot: 1337517,
            },
          }),
      ),
    );
  }, 1300);
}
```

**Lưu ý quan trọng**

- `pool` phải khớp với asset animation của bạn.
- `repeat`/`duration` điều chỉnh tốc độ quay (thường 0.3–0.4s).
- Dùng `isResult = true` để báo client “đã dừng”.
- Metadata tùy chọn truyền qua `extra` (ví dụ jackpot, payout…).

---

## 7. Troubleshooting & Tips

1. **Embed không hiển thị** → kiểm tra bạn có gọi `.addEmbed()` trên `SmartMessage`.
2. **Animated image không chạy** → chắc chắn `pool` đúng định dạng và client hỗ trợ type `6`.
3. **Update không thành công** → đảm bảo embed được gửi bởi bot (không thể update message người dùng).
4. **Form input không hiện** → ứng dụng Mezon phải hỗ trợ loại input tương ứng (text/select).

---

## 8. API Reference

### Phương thức chính

```ts
setColor(color: string): EmbedBuilder
setTitle(title: string): EmbedBuilder
setURL(url: string): EmbedBuilder
setAuthor(name: string, options?: { icon_url?: string; url?: string }): EmbedBuilder
setDescription(description: string): EmbedBuilder
setDescriptionMarkdown(description: string | string[], options?: {
  language?: string;
  before?: string;
  after?: string;
  wrap?: boolean;
}): EmbedBuilder
setThumbnail(url: string): EmbedBuilder
setImage(url: string): EmbedBuilder
setTimestamp(timestamp?: Date | string): EmbedBuilder
setFooter(text: string, iconUrl?: string): EmbedBuilder
addField(name: string, value: string, inline?: boolean): EmbedBuilder
addTextField(name: string, inputId: string, options?: TextFieldOptions): EmbedBuilder
addSelectField(name: string, inputId: string, options: SelectOption[], selectedValue?: string): EmbedBuilder
addAnimatedImage(options: AnimatedImageOptions): EmbedBuilder
build(): IInteractiveMessageProps
```

### Type Definitions

```ts
interface TextFieldOptions {
  placeholder?: string;
  defaultValue?: string | number;
  isNumber?: boolean;
}

interface SelectOption {
  label: string;
  value: string;
}

interface AnimatedImageOptions {
  id?: string;
  name?: string;
  value?: string;
  imageUrl: string;
  positionUrl: string;
  pool: string[][];
  repeat?: number;
  duration?: number;
  isResult?: boolean;
  extra?: Record<string, unknown>;
}
```

---

## 9. Ví dụ hoàn chỉnh: Poll Creator

```ts
import {
  Command,
  AutoContext,
  SmartMessage,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('poll')
async function onPoll(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.build()
      .addEmbed(
        new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('POLL CREATOR')
          .addTextField('Title', 'title', { placeholder: 'Input title here' })
          .addTextField('Option 1️⃣', 'option_1', {
            placeholder: 'Input option 1 here',
          })
          .addTextField('Option 2️⃣', 'option_2', {
            placeholder: 'Input option 2 here',
          })
          .addSelectField(
            'Type',
            'type',
            [
              { label: 'Single choice', value: 'SINGLE' },
              { label: 'Multiple choice', value: 'MULTIPLE' },
            ],
            'SINGLE',
          )
          .addTextField('Expired Time (hour)', 'expired', {
            placeholder: 'Input expired time here',
            defaultValue: 168,
            isNumber: true,
          })
          .setTimestamp()
          .setFooter('Powered by Mezon', 'https://example.com/icon.jpg'),
      )
      .addButton(
        new ButtonBuilder().setLabel('Cancel').setStyle(ButtonStyle.Danger),
      )
      .addButton(
        new ButtonBuilder().setLabel('Add Option').setStyle(ButtonStyle.Secondary),
      )
      .addButton(
        new ButtonBuilder().setLabel('Create').setStyle(ButtonStyle.Success),
      ),
  );
}
```

---

## 10. Tài liệu liên quan

- [Text Message](/docs/message-template/text-message)
- [Attachments](/docs/message-template/attachments)
- [Button onClick](/docs/interaction/onclick)

---

id: embed-form-button
title: Embed, Form, Button
sidebar_position: 3

---

Hướng dẫn tạo rich embeds với EmbedBuilder, form inputs, và buttons.

## EmbedBuilder

EmbedBuilder cung cấp fluent API để tạo rich embeds (thẻ tin nhắn đẹp) với các field, ảnh, và form inputs.

![Embed Example](/img/embed.png)

### Cú pháp cơ bản

```ts
import { EmbedBuilder } from "@n0xgg04/nezon";

const embed = new EmbedBuilder()
  .setColor("#abcdef")
  .setTitle("Title")
  .setDescription("Description")
  .build();
```

### Ví dụ đơn giản

```ts
import { Command, AutoContext, SmartMessage, EmbedBuilder } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('embed')
async onEmbed(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('')
      .addEmbed(
        new EmbedBuilder()
          .setColor('#abcdef')
          .setTitle('Example Embed')
          .setDescription('This is an example embed')
      )
  );
}
```

### Description với Markdown / Code block

```ts
await managedMessage.reply(
  SmartMessage.text("").addEmbed(
    new EmbedBuilder()
      .setColor("#E91E63")
      .setTitle(
        "[SPECIALIZED (CHUYÊN NGÀNH)] The basic managerial skill(s) is(are)"
      )
      .setDescriptionMarkdown(
        [
          "1 - business strategy, human resource practices, organisational capabilities",
          "2 - marketing strategy, human resource practices, organisational capabilities",
          "3 - business strategy, human resource practices, organisational structure",
          "4 - marketing strategy, human resource practices, organisational structure",
          "5 - to supervise",
          "6 - to stimulate",
          "7 - to motivate",
          "8 - all of the above",
        ],
        { after: "(Chọn đáp án đúng tương ứng phía bên dưới!)" }
      )
  )
);
```

- `setDescriptionMarkdown(content, options?)` tự động wrap nội dung với triple backticks
- `content` nhận `string` hoặc `string[]`, auto join bằng xuống dòng
- `options.language` đặt ngôn ngữ cho code block (ví dụ `'json'`)
- `options.before` / `options.after` thêm text trước hoặc sau code block (tự thêm xuống dòng nếu thiếu)
- `options.wrap = false` để bỏ qua code block wrapper và chỉ nối chuỗi thô

## Embed Fields

Thêm các field vào embed với `addField()`.

### Cú pháp

```ts
addField(name: string, value: string, inline?: boolean): EmbedBuilder
```

### Ví dụ

```ts
@Command('embed')
async onEmbed(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('')
      .addEmbed(
        new EmbedBuilder()
          .setColor('#abcdef')
          .setTitle('User Info')
          .addField('Username', 'john_doe', true)
          .addField('Level', '42', true)
          .addField('Status', 'Online', true)
          .addField('Description', 'A long description that spans multiple lines', false)
      )
  );
}
```

### Type

```ts
addField(name: string, value: string, inline?: boolean): EmbedBuilder
// inline: true = hiển thị cùng hàng, false = hiển thị full width
```

## Embed với Thumbnail và Image

```ts
@Command('embed')
async onEmbed(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('')
      .addEmbed(
        new EmbedBuilder()
          .setColor('#abcdef')
          .setTitle('Rich Embed')
          .setThumbnail('https://example.com/thumb.jpg')
          .addField('Field 1', 'Value 1', true)
          .addField('Field 2', 'Value 2', true)
          .setImage('https://example.com/image.jpg')
          .setFooter('Footer text', 'https://example.com/footer-icon.jpg')
      )
  );
}
```

## Form Inputs trong Embed

EmbedBuilder hỗ trợ thêm form inputs (text fields và select fields) vào embed.

![Form Example](/img/form.png)

### Text Field

```ts
addTextField(
  name: string,
  inputId: string,
  options?: {
    placeholder?: string;
    defaultValue?: string | number;
    isNumber?: boolean;
  }
): EmbedBuilder
```

### Ví dụ Text Field

```ts
@Command('form')
async onForm(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.build()
      .addEmbed(
        new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('POLL CREATOR')
          .addTextField('Title', 'title', {
            placeholder: 'Input title here',
            defaultValue: '',
          })
          .addTextField('Option 1️⃣', 'option_1', {
            placeholder: 'Input option 1 here',
          })
          .addTextField('Expired Time (hour)', 'expired', {
            placeholder: 'Input expired time here',
            defaultValue: 168,
            isNumber: true,
          })
      )
  );
}
```

### Select Field

```ts
addSelectField(
  name: string,
  inputId: string,
  options: Array<{ label: string; value: string }>,
  selectedValue?: string
): EmbedBuilder
```

### Ví dụ Select Field

```ts
@Command('form')
async onForm(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.build()
      .addEmbed(
        new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('POLL CREATOR')
          .addSelectField('Type', 'type', [
            { label: 'Single choice', value: 'SINGLE' },
            { label: 'Multiple choice', value: 'MULTIPLE' },
          ], 'SINGLE')
      )
  );
}
```

## Button với Embed

Kết hợp buttons với embeds:

```ts
@Command('embed-button')
async onEmbedButton(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('')
      .addEmbed(
        new EmbedBuilder()
          .setColor('#abcdef')
          .setTitle('Action Required')
          .setDescription('Please choose an option')
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success)
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Reject')
          .setStyle(ButtonStyle.Danger)
      )
  );
}
```

## Animated Image / Slots

Sử dụng animated image để tạo hiệu ứng slot machine hoặc minigame:

```ts
import type { Nezon, NezonUtilsService } from '@n0xgg04/nezon';

@Command('slots')
async onSlots(
  @AutoContext() [managedMessage]: Nezon.AutoContext,
  @NezonUtils() utils: NezonUtilsService,
) {
  const pool = [
    ['1.png', '2.png', '3.png'],
    ['4.png', '5.png', '6.png'],
    ['7.png', '8.png', '9.png'],
  ];

  const ack = await managedMessage.reply(
    SmartMessage.text('')
      .addEmbed(
        new EmbedBuilder()
          .setColor('#1F8B4C')
          .setTitle('🎰 Kết quả Slots 🎰')
          .addAnimatedImage({
            id: 'slots',
            imageUrl: 'https://cdn.mezon.ai/.../slots.png',
            positionUrl: 'https://cdn.mezon.ai/.../slots.json',
            pool,
            repeat: 3,
            duration: 0.35,
          }),
      ),
  );

  if (!ack?.message_id || !ack?.channel_id) {
    return;
  }

  setTimeout(async () => {
    const animatedMessage = await utils.getManagedMessage(
      ack.message_id,
      ack.channel_id,
    );
    if (!animatedMessage) {
      return;
    }
    await animatedMessage.update(
      SmartMessage.text('')
        .addEmbed(
          new EmbedBuilder()
            .setColor('#1F8B4C')
            .setTitle('🎰 Kết quả Slots 🎰')
            .addAnimatedImage({
              id: 'slots-result',
              imageUrl: 'https://cdn.mezon.ai/.../slots.png',
              positionUrl: 'https://cdn.mezon.ai/.../slots.json',
              pool,
              repeat: 3,
              duration: 0.35,
              isResult: true,
              extra: {
                jackpot: 1337517,
              },
            }),
        ),
    );
  }, 1300);
}
```

- `addAnimatedImage()` tạo một field với `inputs.type = 6` (animation).
- `pool` là mảng 2D các frame để render animation cho từng cột (phải có asset thực tế).
- `repeat` + `duration` điều khiển tốc độ/quãng quay (thay đổi quá nhanh sẽ khó đọc).
- `isResult = true` báo client hiển thị frame cuối cùng; dùng `extra` để truyền metadata bổ sung (ví dụ `jackpot`, payouts, ...).
- Nếu muốn transition giống utility slots, gửi animation trước rồi dùng `managedMessage.update()` (hoặc `NezonUtils.getManagedMessage()` + `update()`) để thay bằng embed kết quả sau ~1.3s.

## EmbedBuilder API Reference

### Basic Methods

```ts
setColor(color: string): EmbedBuilder
setTitle(title: string): EmbedBuilder
setURL(url: string): EmbedBuilder
setAuthor(name: string, iconUrl?: string, url?: string): EmbedBuilder
setDescription(description: string): EmbedBuilder
setDescriptionMarkdown(description: string | string[], options?: {
  language?: string;
  before?: string;
  after?: string;
  wrap?: boolean;
}): EmbedBuilder
setThumbnail(url: string): EmbedBuilder
setImage(url: string): EmbedBuilder
setTimestamp(timestamp?: Date | string): EmbedBuilder
setFooter(text: string, iconUrl?: string): EmbedBuilder
addAnimatedImage(options: AnimatedImageOptions): EmbedBuilder
```

### Field Methods

```ts
addField(name: string, value: string, inline?: boolean): EmbedBuilder
addTextField(name: string, inputId: string, options?: TextFieldOptions): EmbedBuilder
addSelectField(name: string, inputId: string, options: SelectOption[], selectedValue?: string): EmbedBuilder
```

### Build

```ts
build(): IInteractiveMessageProps
```

## Type Definitions

```ts
interface TextFieldOptions {
  placeholder?: string;
  defaultValue?: string | number;
  isNumber?: boolean;
}

interface SelectOption {
  label: string;
  value: string;
}

interface AnimatedImageOptions {
  id?: string;
  name?: string;
  value?: string;
  imageUrl: string;
  positionUrl: string;
  pool: string[][];
  repeat?: number;
  duration?: number;
  isResult?: boolean;
  extra?: Record<string, unknown>;
}
```

## Ví dụ hoàn chỉnh: Poll Creator

```ts
import { Command, AutoContext, SmartMessage, EmbedBuilder, ButtonBuilder, ButtonStyle } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('poll')
async onPoll(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.build()
      .addEmbed(
        new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('POLL CREATOR')
          .addTextField('Title', 'title', {
            placeholder: 'Input title here',
            defaultValue: '',
          })
          .addTextField('Option 1️⃣', 'option_1', {
            placeholder: 'Input option 1 here',
          })
          .addTextField('Option 2️⃣', 'option_2', {
            placeholder: 'Input option 2 here',
          })
          .addSelectField('Type', 'type', [
            { label: 'Single choice', value: 'SINGLE' },
            { label: 'Multiple choice', value: 'MULTIPLE' },
          ], 'SINGLE')
          .addTextField('Expired Time (hour)', 'expired', {
            placeholder: 'Input expired time here',
            defaultValue: 168,
            isNumber: true,
          })
          .setTimestamp()
          .setFooter('Powered by Mezon', 'https://example.com/icon.jpg')
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Add Option')
          .setStyle(ButtonStyle.Secondary)
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Create')
          .setStyle(ButtonStyle.Success)
      )
  );
}
```

## Best Practices

1. **Luôn set color cho embed**

   ```ts
   .setColor('#abcdef')
   ```

2. **Sử dụng inline fields cho thông tin ngắn**

   ```ts
   .addField('Name', 'Value', true)
   ```

3. **Sử dụng full-width fields cho mô tả dài**

   ```ts
   .addField('Description', 'Long text...', false)
   ```

4. **Kết hợp với buttons để tạo interactive UI**
   ```ts
   SmartMessage.text('')
     .addEmbed(...)
     .addButton(...)
   ```

## Xem thêm

- [Text Message](/docs/message-template/text-message) - Text và System messages
- [Attachments](/docs/message-template/attachments) - Images, files, audio
- [Button onClick](/docs/interaction/onclick) - onClick handlers cho buttons
