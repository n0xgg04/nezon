---
id: smart-message
title: SmartMessage - Builder thông minh cho Message Payload
sidebar_position: 0
---

SmartMessage là fluent builder giúp tạo message payload cho Mezon SDK một cách dễ dàng và type-safe. Thay vì phải tạo `ChannelMessageContent` thủ công, bạn có thể sử dụng SmartMessage để build message với cú pháp rõ ràng và dễ đọc.

## Tổng quan

SmartMessage là một wrapper thông minh trên `ChannelMessageContent` của Mezon SDK, cung cấp:

- **Fluent API**: Chain methods để build message phức tạp
- **Type Safety**: Đảm bảo type correctness với TypeScript
- **Tự động chuyển đổi**: Tự động convert sang format Mezon SDK khi gửi
- **Hỗ trợ đầy đủ**: Text, System, Image, Voice, Attachments, Buttons, Embeds

## Kiến trúc và cách hoạt động

### SmartMessage vs Mezon SDK

SmartMessage hoạt động như một layer abstraction trên Mezon SDK:

```
SmartMessage (Nezon)
    ↓ toJSON() / toContent()
ChannelMessageContent (Mezon SDK)
    ↓ send()
Mezon API
```

### Quá trình chuyển đổi

Khi bạn gọi `message.reply(SmartMessage.text('Hello'))`, Nezon sẽ:

1. **Normalize**: Chuyển SmartMessage thành `NormalizedSmartMessage`
2. **Extract**: Tách `content` và `attachments`
3. **Send**: Gọi Mezon SDK với payload đã chuẩn hóa

```ts
// Bên trong Nezon
const payload = smartMessage.toJSON();
// payload = {
//   content: { t: 'Hello', components: [...], embed: [...] },
//   attachments: [...]
// }

await channel.send(payload.content, undefined, payload.attachments);
```

## Các phương thức tạo SmartMessage

### Static Methods

#### `SmartMessage.text()`

Tạo text message cơ bản.

```ts
SmartMessage.text(content: string): SmartMessage
```

**Ví dụ:**

```ts
const message = SmartMessage.text("Hello, World!");
```

**Tương đương Mezon SDK:**

```ts
const content: ChannelMessageContent = { t: "Hello, World!" };
```

#### `SmartMessage.system()`

Tạo system message với markdown triple.

```ts
SmartMessage.system(content: string): SmartMessage
```

**Ví dụ:**

```ts
const message = SmartMessage.system("⚠️ Thông báo quan trọng!");
```

**Tương đương Mezon SDK:**

```ts
const content: ChannelMessageContent = {
  t: "⚠️ Thông báo quan trọng!",
  mk: [
    {
      type: EMarkdownType.PRE,
      s: 0,
      e: content.length,
    },
  ],
};
```

#### `SmartMessage.image()`

Tạo message với ảnh đính kèm.

```ts
SmartMessage.image(
  url: string,
  options?: {
    alt?: string;
    filename?: string;
    width?: number;
    height?: number;
  }
): SmartMessage
```

**Ví dụ:**

```ts
const message = SmartMessage.image("https://example.com/image.jpg", {
  alt: "A beautiful image",
  filename: "image.jpg",
  width: 1920,
  height: 1080,
});
```

**Tương đương Mezon SDK:**

```ts
const content: ChannelMessageContent = { t: "A beautiful image" };
const attachments: ApiMessageAttachment[] = [
  {
    url: "https://example.com/image.jpg",
    filetype: "image",
    filename: "image.jpg",
    width: 1920,
    height: 1080,
  },
];
```

#### `SmartMessage.voice()`

Tạo voice message với audio đính kèm.

```ts
SmartMessage.voice(
  url: string,
  options?: {
    transcript?: string;
  }
): SmartMessage
```

**Ví dụ:**

```ts
const message = SmartMessage.voice("https://example.com/audio.mp3", {
  transcript: "This is a voice message",
});
```

**Tương đương Mezon SDK:**

```ts
const content: ChannelMessageContent = { t: "This is a voice message" };
const attachments: ApiMessageAttachment[] = [
  {
    url: "https://example.com/audio.mp3",
    filetype: "audio",
  },
];
```

#### `SmartMessage.build()`

Tạo SmartMessage rỗng (không có content).

```ts
SmartMessage.build(): SmartMessage
```

**Ví dụ:**

```ts
const message = SmartMessage.build()
  .addEmbed(new EmbedBuilder().setTitle("Title"))
  .addButton(new ButtonBuilder().setLabel("Click"));
```

**Tương đương Mezon SDK:**

```ts
const content: ChannelMessageContent = {
  embed: [{ title: "Title" }],
  components: [{ components: [{ label: "Click" }] }],
};
```

#### `SmartMessage.raw()`

Tạo SmartMessage từ `ChannelMessageContent` có sẵn (advanced).

```ts
SmartMessage.raw(
  content: ChannelMessageContent,
  attachments?: ApiMessageAttachment[]
): SmartMessage
```

**Ví dụ:**

```ts
const customContent: ChannelMessageContent = {
  t: "Custom message",
  mk: [
    /* custom markdown */
  ],
};

const message = SmartMessage.raw(customContent, [
  { url: "https://example.com/file.pdf", filetype: "application/pdf" },
]);
```

## Instance Methods (Chainable)

Tất cả các instance methods đều trả về `this` để hỗ trợ method chaining.

### `.addButton()`

Thêm button vào message. Buttons tự động được nhóm thành action rows (tối đa 5 buttons/row).

```ts
addButton(button: ButtonBuilder | ButtonComponent): this
```

**Ví dụ:**

```ts
const message = SmartMessage.text("Choose an option:")
  .addButton(
    new ButtonBuilder()
      .setLabel("Option 1")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("option/1")
  )
  .addButton(
    new ButtonBuilder()
      .setLabel("Option 2")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("option/2")
  );
```

**Tương đương Mezon SDK:**

```ts
const content: ChannelMessageContent = {
  t: "Choose an option:",
  components: [
    {
      components: [
        { label: "Option 1", style: 1, custom_id: "option/1" },
        { label: "Option 2", style: 2, custom_id: "option/2" },
      ],
    },
  ],
};
```

### `.addImage()`

Thêm ảnh vào message.

```ts
addImage(
  url: string,
  options?: {
    filename?: string;
    width?: number;
    height?: number;
  }
): this
```

**Ví dụ:**

```ts
const message = SmartMessage.text("Check out these images!")
  .addImage("https://example.com/img1.jpg", { filename: "img1.jpg" })
  .addImage("https://example.com/img2.jpg", { filename: "img2.jpg" });
```

### `.addFile()`

Thêm file đính kèm vào message.

```ts
addFile(
  url: string,
  filename: string,
  filetype: string,
  options?: {
    size?: number;
  }
): this
```

**Ví dụ:**

```ts
const message = SmartMessage.text("Download the file:").addFile(
  "https://example.com/document.pdf",
  "document.pdf",
  "application/pdf",
  { size: 1024000 }
);
```

### `.addEmbed()`

Thêm embed vào message.

```ts
addEmbed(embed: EmbedBuilder | IInteractiveMessageProps): this
```

**Ví dụ:**

```ts
const message = SmartMessage.text("Rich embed:").addEmbed(
  new EmbedBuilder()
    .setTitle("Title")
    .setDescription("Description")
    .setColor("#f0a8da")
    .addField("Field 1", "Value 1", true)
    .addField("Field 2", "Value 2", true)
);
```

### `.addMention()`

Map placeholder → user_id để SmartMessage tự render mention với `@username` và metadata `mentions`.

```ts
addMention(key: string, userId: string): this
addMention(mentions: Record<string, string>): this
```

**Cách sử dụng**

1. Trong nội dung text, đặt `{{placeholder_name}}` tại vị trí cần mention.
2. Gọi `.addMention({ placeholder_name: 'USER_ID' })` hoặc `.addMention('placeholder_name', 'USER_ID')`.
3. Khi gửi qua `ManagedMessage`/`DMHelper`, SDK sẽ tìm username trong clan, thay thế bằng `@username`, đồng thời truyền `mentions` với `s`/`e`.

**Ví dụ**

```ts
@Command("hi")
async function onHi(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text("Hello {{user_id_anh_luongtuan}} 👋")
      .addMention({ user_id_anh_luongtuan: "12132124214" })
  );
}
```

Output thực tế:

- Nội dung: `Hello @anh.luongtuan 👋`.
- Mentions: `[{ user_id: "12132124214", username: "anh.luongtuan", s: 6, e: 20 }]`.

Nếu không tìm được username, SDK fallback về user_id.

## Chuyển đổi sang Mezon SDK

SmartMessage cung cấp các methods để chuyển đổi sang format Mezon SDK:

### `.toJSON()`

Chuyển đổi thành `NormalizedSmartMessage` (bao gồm cả attachments).

```ts
toJSON(): NormalizedSmartMessage

interface NormalizedSmartMessage {
  content: ChannelMessageContent;
  attachments?: ApiMessageAttachment[];
  mentions?: ApiMessageMention[];
  mentionPlaceholders?: Record<string, string>;
}
```

**Ví dụ:**

```ts
const smartMessage = SmartMessage.text("Hello")
  .addImage("https://example.com/img.jpg")
  .addButton(new ButtonBuilder().setLabel("Click"));

const payload = smartMessage.toJSON();
// payload = {
//   content: {
//     t: 'Hello',
//     components: [{ components: [...] }]
//   },
//   attachments: [{ url: '...', filetype: 'image' }]
// }

await channel.send(payload.content, payload.mentions, payload.attachments);
```

### `.toContent()`

Chỉ lấy `ChannelMessageContent` (không có attachments).

```ts
toContent(): ChannelMessageContent
```

**Ví dụ:**

```ts
const smartMessage = SmartMessage.text("Hello").addButton(
  new ButtonBuilder().setLabel("Click")
);

const content = smartMessage.toContent();
// content = {
//   t: 'Hello',
//   components: [{ components: [...] }]
// }

await channel.send(content);
```

### `.toAttachments()`

Chỉ lấy attachments.

```ts
toAttachments(): ApiMessageAttachment[] | undefined
```

**Ví dụ:**

```ts
const smartMessage = SmartMessage.text("Files:")
  .addFile("https://example.com/file1.pdf", "file1.pdf", "application/pdf")
  .addFile("https://example.com/file2.zip", "file2.zip", "application/zip");

const attachments = smartMessage.toAttachments();
// attachments = [
//   { url: '...', filename: 'file1.pdf', filetype: 'application/pdf' },
//   { url: '...', filename: 'file2.zip', filetype: 'application/zip' }
// ]
```

## Kết hợp với Mezon SDK

### Sử dụng trực tiếp với Mezon Client

Bạn có thể sử dụng SmartMessage với Mezon SDK trực tiếp:

```ts
import { MezonClient } from "mezon-sdk";
import { SmartMessage, ButtonBuilder, ButtonStyle } from "@n0xgg04/nezon";

const client = new MezonClient({ token: "YOUR_TOKEN" });

async function sendMessage() {
  const channel = await client.channels.fetch("CHANNEL_ID");

  const smartMessage = SmartMessage.text("Hello from Mezon SDK!").addButton(
    new ButtonBuilder().setLabel("Click Me").setStyle(ButtonStyle.Primary)
  );

  const payload = smartMessage.toJSON();

  await channel.send(payload.content, undefined, payload.attachments);
}
```

### Tích hợp với Mezon SDK Events

Bạn có thể sử dụng SmartMessage trong Mezon SDK event handlers:

```ts
import { MezonClient } from "mezon-sdk";
import { SmartMessage, ButtonBuilder, ButtonStyle } from "@n0xgg04/nezon";

const client = new MezonClient({ token: "YOUR_TOKEN" });

client.on("message", async (message) => {
  if (message.content?.t === "ping") {
    const reply = SmartMessage.text("pong!").addButton(
      new ButtonBuilder()
        .setLabel("Ping Again")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("ping/again")
    );

    const payload = reply.toJSON();
    await message.reply(payload.content, undefined, payload.attachments);
  }
});
```

### Tạo payload động với Mezon SDK

Kết hợp SmartMessage với logic Mezon SDK để tạo payload phức tạp:

```ts
import { MezonClient, User, Channel } from "mezon-sdk";
import { SmartMessage, EmbedBuilder } from "@n0xgg04/nezon";

async function createDynamicMessage(user: User, channel: Channel) {
  const embed = new EmbedBuilder()
    .setTitle(`Welcome to ${channel.name}!`)
    .setDescription(`Hello ${user.display_name}`)
    .setColor("#00ff00");

  const message = SmartMessage.system(`User ${user.user_id} joined`).addEmbed(
    embed
  );

  if (user.avatar_url) {
    message.addImage(user.avatar_url, { filename: "avatar.jpg" });
  }

  return message.toJSON();
}

const client = new MezonClient({ token: "YOUR_TOKEN" });
client.on("userJoined", async (event) => {
  const user = await client.users.fetch(event.user_id);
  const channel = await client.channels.fetch(event.channel_id);

  const payload = await createDynamicMessage(user, channel);
  const targetChannel = await client.channels.fetch("TARGET_CHANNEL_ID");

  await targetChannel.send(payload.content, undefined, payload.attachments);
});
```

### Sử dụng với Mezon SDK Webhooks

SmartMessage cũng có thể được sử dụng với webhook responses:

```ts
import express from "express";
import { SmartMessage, ButtonBuilder, ButtonStyle } from "@n0xgg04/nezon";

const app = express();

app.post("/webhook", async (req, res) => {
  const { message } = req.body;

  if (message.content?.t === "hello") {
    const reply = SmartMessage.text("Hello from webhook!").addButton(
      new ButtonBuilder().setLabel("Respond").setStyle(ButtonStyle.Primary)
    );

    const payload = reply.toJSON();

    res.json({
      content: payload.content,
      attachments: payload.attachments,
    });
  }
});
```

## SmartMessageLike - Flexible Input

Nezon hỗ trợ nhiều kiểu input cho message, tự động normalize:

```ts
type SmartMessageLike =
  | SmartMessage
  | NormalizedSmartMessage
  | ChannelMessageContent
  | string;
```

**Ví dụ các cách sử dụng:**

```ts
await message.reply(SmartMessage.text("Hello"));
await message.reply("Hello");
await message.reply({ t: "Hello" });
await message.reply({
  content: { t: "Hello" },
  attachments: [{ url: "...", filetype: "image" }],
});
```

Tất cả đều được normalize thành `NormalizedSmartMessage` trước khi gửi.

## Ví dụ thực tế

### Ví dụ 1: Menu với nhiều buttons

```ts
import { Command, AutoContext, SmartMessage, ButtonBuilder, ButtonStyle } from '@n0xgg04/nezon';

@Command('menu')
async onMenu(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.text('Chọn một tùy chọn:')
      .addButton(
        new ButtonBuilder()
          .setLabel('Thông tin')
          .setStyle(ButtonStyle.Primary)
          .setCustomId('menu/info')
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Cài đặt')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('menu/settings')
      )
      .addButton(
        new ButtonBuilder()
          .setLabel('Hỗ trợ')
          .setStyle(ButtonStyle.Success)
          .setCustomId('menu/support')
      )
  );
}
```

### Ví dụ 2: Rich message với embed và attachments

```ts
@Command('product')
async onProduct(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.text('Sản phẩm mới:')
      .addEmbed(
        new EmbedBuilder()
          .setTitle('iPhone 15 Pro')
          .setDescription('Flagship smartphone mới nhất')
          .setColor('#007AFF')
          .addField('Giá', '29.990.000 VNĐ', true)
          .addField('Màu sắc', 'Titanium Blue', true)
          .setThumbnail('https://example.com/iphone-thumb.jpg')
      )
      .addImage('https://example.com/iphone-full.jpg', {
        filename: 'iphone.jpg'
      })
      .addButton(
        new ButtonBuilder()
          .setLabel('Mua ngay')
          .setStyle(ButtonStyle.Primary)
          .setCustomId('buy/iphone15')
      )
  );
}
```

### Ví dụ 3: Message với file đính kèm

```ts
@Command('download')
async onDownload(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(
    SmartMessage.text('Tài liệu hướng dẫn:')
      .addFile(
        'https://example.com/guide.pdf',
        'huong-dan.pdf',
        'application/pdf',
        { size: 2048000 }
      )
      .addFile(
        'https://example.com/sample.zip',
        'mau.zip',
        'application/x-zip-compressed',
        { size: 5120000 }
      )
  );
}
```

### Ví dụ 4: Kết hợp với Mezon SDK để tạo message động

```ts
import { MezonClient, User, Clan } from "mezon-sdk";
import { SmartMessage, EmbedBuilder } from "@n0xgg04/nezon";

async function createUserProfileMessage(client: MezonClient, userId: string) {
  const user: User = await client.users.fetch(userId);
  const clan: Clan | null = user.clan_id
    ? await client.clans.fetch(user.clan_id)
    : null;

  const embed = new EmbedBuilder()
    .setTitle(`${user.display_name}'s Profile`)
    .setDescription(user.bio || "No bio")
    .addField("User ID", user.user_id, true)
    .addField("Clan", clan?.name || "None", true);

  const message = SmartMessage.text(
    `Thông tin user ${user.display_name}`
  ).addEmbed(embed);

  if (user.avatar_url) {
    message.addImage(user.avatar_url, { filename: "avatar.jpg" });
  }

  return message.toJSON();
}
```

## Best Practices

### 1. Sử dụng method chaining

```ts
const message = SmartMessage.text('Hello')
  .addButton(...)
  .addEmbed(...)
  .addImage(...);
```

### 2. Tách logic phức tạp thành functions

```ts
function createWelcomeMessage(user: User): SmartMessage {
  return SmartMessage.system(`Welcome ${user.display_name}!`)
    .addEmbed(
      new EmbedBuilder()
        .setTitle("Getting Started")
        .setDescription("Chào mừng bạn đến với server!")
    )
    .addButton(
      new ButtonBuilder()
        .setLabel("Xem hướng dẫn")
        .setStyle(ButtonStyle.Primary)
    );
}
```

### 3. Sử dụng `.toJSON()` khi cần tích hợp với Mezon SDK

```ts
const smartMessage = SmartMessage.text("Hello");
const payload = smartMessage.toJSON();

await mezonChannel.send(payload.content, undefined, payload.attachments);
```

### 4. Tận dụng type safety

```ts
const message: SmartMessage = SmartMessage.text('Hello');
message.addButton(...);
```

### 5. Sử dụng `SmartMessage.build()` cho message không có text

```ts
const message = SmartMessage.build()
  .addEmbed(new EmbedBuilder().setTitle("Title Only"))
  .addButton(new ButtonBuilder().setLabel("Click"));
```

## So sánh với Mezon SDK thuần

| Tính năng       | SmartMessage               | Mezon SDK thuần           |
| --------------- | -------------------------- | ------------------------- |
| Cú pháp         | Fluent, dễ đọc             | Object literal phức tạp   |
| Type Safety     | ✅ Full TypeScript support | ⚠️ Manual typing          |
| Method Chaining | ✅ Hỗ trợ                  | ❌ Không hỗ trợ           |
| Auto Grouping   | ✅ Buttons tự động nhóm    | ❌ Phải tự nhóm           |
| Attachments     | ✅ Dễ thêm                 | ⚠️ Phải quản lý riêng     |
| Embeds          | ✅ Builder pattern         | ⚠️ Object literal         |
| Learning Curve  | ✅ Dễ học                  | ⚠️ Cần hiểu API structure |

## API Reference

### Static Methods

- `SmartMessage.text(content: string): SmartMessage`
- `SmartMessage.system(content: string): SmartMessage`
- `SmartMessage.image(url: string, options?): SmartMessage`
- `SmartMessage.voice(url: string, options?): SmartMessage`
- `SmartMessage.build(): SmartMessage`
- `SmartMessage.raw(content: ChannelMessageContent, attachments?): SmartMessage`

### Instance Methods

- `.addButton(button: ButtonBuilder | ButtonComponent): this`
- `.addImage(url: string, options?): this`
- `.addFile(url: string, filename: string, filetype: string, options?): this`
- `.addEmbed(embed: EmbedBuilder | IInteractiveMessageProps): this`
- `.toJSON(): NormalizedSmartMessage`
- `.toContent(): ChannelMessageContent`
- `.toAttachments(): ApiMessageAttachment[] | undefined`

## Xem thêm

- [Text Message](/docs/message-template/text-message) - Text và System messages cơ bản
- [Attachments](/docs/message-template/attachments) - Chi tiết về attachments
- [Embed, Form, Button](/docs/message-template/embed-form-button) - Embeds và forms
- [Direct Message](/docs/message-template/dm) - Gửi DM với SmartMessage
