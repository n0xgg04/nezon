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
import { EmbedBuilder } from '@n0xgg04/nezon';

const embed = new EmbedBuilder()
  .setColor('#abcdef')
  .setTitle('Title')
  .setDescription('Description')
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

## EmbedBuilder API Reference

### Basic Methods

```ts
setColor(color: string): EmbedBuilder
setTitle(title: string): EmbedBuilder
setURL(url: string): EmbedBuilder
setAuthor(name: string, iconUrl?: string, url?: string): EmbedBuilder
setDescription(description: string): EmbedBuilder
setThumbnail(url: string): EmbedBuilder
setImage(url: string): EmbedBuilder
setTimestamp(timestamp?: Date | string): EmbedBuilder
setFooter(text: string, iconUrl?: string): EmbedBuilder
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

