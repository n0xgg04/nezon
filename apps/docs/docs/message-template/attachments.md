---
id: attachments
title: Attachments
sidebar_position: 2
---

Hướng dẫn thêm attachments (ảnh, file, audio) vào message với SmartMessage.

## Lấy attachments người dùng gửi

Sử dụng decorator `@Attachments()` để đọc danh sách file mà user gửi cùng command.

```ts
import { Command, Attachments, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('inspect')
async onInspect(
  @Attachments() files: Nezon.Attachments,
  @Attachments(0) firstFile: Nezon.Attachment | undefined,
  @AutoContext('message') managedMessage: Nezon.AutoContextType.Message,
) {
  const summary = [
    `Tổng số file: ${files.length}`,
    `File đầu tiên: ${firstFile?.filename ?? firstFile?.url ?? 'không có'}`,
  ].join('\n');
  await managedMessage.reply(SmartMessage.text(summary));
}
```

## Image Attachments

Thêm ảnh vào message với `addImage()`.

### Cú pháp

```ts
addImage(
  url: string,
  options?: {
    filename?: string;
    width?: number;
    height?: number;
  }
): SmartMessage
```

### Ví dụ cơ bản

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('image')
async onImage(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Check out this image!')
      .addImage('https://example.com/image.jpg')
  );
}
```

### Ví dụ với options

```ts
@Command('image')
async onImage(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('High quality image')
      .addImage('https://example.com/image.jpg', {
        filename: 'my-image.jpg',
        width: 1920,
        height: 1080,
      })
  );
}
```

### Type

```ts
addImage(url: string, options?: ImageOptions): SmartMessage

interface ImageOptions {
  filename?: string;  // Tên file khi download
  width?: number;     // Chiều rộng (pixels)
  height?: number;    // Chiều cao (pixels)
}
```

### Nhiều ảnh

```ts
@Command('gallery')
async onGallery(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Image gallery')
      .addImage('https://example.com/image1.jpg', { filename: 'img1.jpg' })
      .addImage('https://example.com/image2.jpg', { filename: 'img2.jpg' })
      .addImage('https://example.com/image3.jpg', { filename: 'img3.jpg' })
  );
}
```

## File Attachments

Thêm file bất kỳ (PDF, ZIP, DOC, etc.) vào message với `addFile()`.

### Cú pháp

```ts
addFile(
  url: string,
  filename: string,
  filetype: string,
  options?: {
    size?: number;
  }
): SmartMessage
```

### Ví dụ

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('file')
async onFile(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Download this file:')
      .addFile(
        'https://example.com/document.pdf',
        'document.pdf',
        'application/pdf',
        { size: 1024000 } // 1MB
      )
  );
}
```

### Type

```ts
addFile(
  url: string,
  filename: string,
  filetype: string,
  options?: FileOptions
): SmartMessage

interface FileOptions {
  size?: number;  // Kích thước file (bytes)
}
```

### Ví dụ với ZIP file

```ts
@Command('download')
async onDownload(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Archive file:')
      .addFile(
        'https://example.com/archive.zip',
        'archive.zip',
        'application/x-zip-compressed',
        { size: 5242880 } // 5MB
      )
  );
}
```

## Audio/Voice Attachments

Sử dụng `SmartMessage.voice()` để gửi audio message.

### Cú pháp

```ts
SmartMessage.voice(
  url: string,
  options?: {
    transcript?: string;
  }
): SmartMessage
```

### Ví dụ

```ts
import { Command, AutoContext, SmartMessage } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Command('voice')
async onVoice(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.voice('https://example.com/audio.mp3', {
      transcript: 'This is a voice message transcript',
    })
  );
}
```

### Type

```ts
static voice(url: string, options?: VoiceOptions): SmartMessage

interface VoiceOptions {
  transcript?: string;  // Transcript của audio
}
```

## Kết hợp nhiều loại attachments

```ts
@Command('mixed')
async onMixed(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.text('Mixed content:')
      .addImage('https://example.com/image.jpg', { filename: 'img.jpg' })
      .addFile('https://example.com/doc.pdf', 'doc.pdf', 'application/pdf')
      .addButton(
        new ButtonBuilder()
          .setLabel('Download All')
          .setStyle(ButtonStyle.Primary)
      )
  );
}
```

## SmartMessage.image() (Static method)

Ngoài `addImage()`, bạn cũng có thể dùng static method `SmartMessage.image()`:

```ts
SmartMessage.image(url: string, options?: {
  alt?: string;
  filename?: string;
}): SmartMessage
```

### Ví dụ

```ts
@Command('photo')
async onPhoto(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(
    SmartMessage.image('https://example.com/photo.jpg', {
      alt: 'A beautiful photo',
      filename: 'photo.jpg',
    })
  );
}
```

## So sánh các phương thức

| Method | Use Case | Returns |
|--------|----------|---------|
| `SmartMessage.image()` | Tạo message chỉ có ảnh | `SmartMessage` |
| `.addImage()` | Thêm ảnh vào message hiện có | `SmartMessage` (chainable) |
| `SmartMessage.voice()` | Tạo message chỉ có audio | `SmartMessage` |
| `.addFile()` | Thêm file vào message hiện có | `SmartMessage` (chainable) |

## Best Practices

1. **Luôn cung cấp filename cho attachments**
   ```ts
   .addImage(url, { filename: 'image.jpg' })
   ```

2. **Sử dụng size cho file lớn**
   ```ts
   .addFile(url, 'file.zip', 'application/zip', { size: 10485760 })
   ```

3. **Kết hợp với text để mô tả**
   ```ts
   SmartMessage.text('Download this file:')
     .addFile(...)
   ```

## API Reference

### addImage()

```ts
addImage(url: string, options?: ImageOptions): SmartMessage
```

### addFile()

```ts
addFile(
  url: string,
  filename: string,
  filetype: string,
  options?: FileOptions
): SmartMessage
```

### SmartMessage.voice()

```ts
static voice(url: string, options?: VoiceOptions): SmartMessage
```

### SmartMessage.image()

```ts
static image(url: string, options?: { alt?: string; filename?: string }): SmartMessage
```

## Xem thêm

- [Text Message](/docs/message-template/text-message) - Text và System messages
- [Embed, Form, Button](/docs/message-template/embed-form-button) - Embeds và forms

