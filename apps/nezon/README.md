# Nezon

Nezon là thư viện NestJS giúp xây dựng bot cho nền tảng Mezon nhanh chóng, tương tự trải nghiệm của Necord với Discord.

## Tính năng chính

- **Decorator command**: Định nghĩa text command bằng `@Command`, hỗ trợ alias, prefix riêng và tự động phân tích tham số.
- **Decorator component**: Bắt sự kiện nút bấm (và các component khác) qua `@Component`, hỗ trợ pattern/regex cho `button_id`, kèm `@ComponentTarget` để lấy ngay `Message` đã cache. Hỗ trợ named parameters (RESTful pattern) như `/user/:user_id/:action`.
- **Injection ngữ cảnh typed**: Các decorator `@Message`, `@Channel`, `@Clan`, `@User`, `@MessageContent`, `@Args`, `@AutoContext`… trả về đối tượng typed từ `mezon-sdk` hoặc helper của Nezon. Namespace `Nezon` cung cấp alias type (`Nezon.Message`, `Nezon.AutoContext`, ...).
- **SmartMessage builder**: `SmartMessage.text/system/image/voice` giúp dựng payload gửi tin nhắn mà không phải thao tác trực tiếp với `ChannelMessageContent`. Hỗ trợ thêm buttons, images, embeds, files.
- **ButtonBuilder & onClick handlers**: Tạo button với fluent API, hỗ trợ inline onClick handler tự động đăng ký và resolve context.
- **EmbedBuilder**: Tạo rich embeds với fields, images, thumbnails, và form inputs (text fields, select fields).
- **Lifecycle tự động**: Khởi tạo, đăng nhập bot, binding event/command/component và shutdown được xử lý trong `NezonModule`.
- **Caching nội bộ**: Hạn chế gọi API lặp lại khi truy cập channel/clan/user/message trong cùng một lần xử lý command.

## Cài đặt

Trong dự án NestJS của bạn:

```bash
yarn add @n0xgg04/nezon
```

Đảm bảo đã cài `mezon-sdk` (được khai báo trong peer dependency).

## Khởi tạo module

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NezonModule } from '@n0xgg04/nezon';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NezonModule.forRoot({
      token: process.env.MEZON_TOKEN ?? '',
      botId: process.env.MEZON_BOT_ID ?? '',
    }),
  ],
})
export class AppModule {}
```

## Ví dụ command cơ bản

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  Args,
  AutoContext,
  MessageContent,
  SmartMessage,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class PingHandler {
  @Command({ name: 'ping', aliases: ['pong'] })
  async onPing(
    @Args() args: Nezon.Args,
    @AutoContext() [message]: Nezon.AutoContext,
    @MessageContent() content?: string,
  ) {
    const suffix = args.length ? args.join(' ') : 'pong';
    await message.reply(SmartMessage.text(`✅ ${suffix} (${content})`));
  }
}
```

## Ví dụ button với ButtonBuilder

### Sử dụng setCustomId với @Component

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  AutoContext,
  Component,
  ComponentParams,
  SmartMessage,
  ButtonBuilder,
  ButtonStyle,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ButtonHandler {
  @Command('button')
  async askForConfirm(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
      SmartMessage.text('Nhấn nút để xác nhận.')
        .addButton(
          new ButtonBuilder()
            .setCustomId('/demo/success/12345')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success),
        ),
    );
  }

  @Component({ pattern: '/demo/success/:source_id' })
  async onConfirm(
    @ComponentParams('source_id') sourceId: string | undefined,
    @AutoContext() [message]: Nezon.AutoContext,
  ) {
    await message.reply(
      SmartMessage.text(`Đã xác nhận với source ID: ${sourceId}`),
    );
  }
}
```

### Sử dụng onClick handler (khuyến nghị)

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  AutoContext,
  SmartMessage,
  ButtonBuilder,
  ButtonStyle,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class ButtonHandler {
  @Command('onclick')
  async onClickDemo(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
      SmartMessage.text('Click the buttons below!')
        .addButton(
          new ButtonBuilder()
            .setLabel('Button 1')
            .setStyle(ButtonStyle.Primary)
            .onClick(async (context) => {
              await context.message.reply(
                SmartMessage.text('Button 1 was clicked!'),
              );
            }),
        )
        .addButton(
          new ButtonBuilder()
            .setLabel('Button 2')
            .setStyle(ButtonStyle.Success)
            .onClick(async ({ message, channel, user }) => {
              const channelName = channel?.name ?? 'unknown';
              const userName = user?.username ?? 'unknown';
              await message.reply(
                SmartMessage.text(
                  `Button 2 was clicked by ${userName} in ${channelName}!`,
                ),
              );
            }),
        ),
    );
  }
}
```

## Ví dụ Embed với EmbedBuilder

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  AutoContext,
  SmartMessage,
  EmbedBuilder,
} from '@n0xgg04/nezon';

@Injectable()
export class EmbedHandler {
  @Command('embed')
  async onEmbedDemo(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
      SmartMessage.text('')
        .addEmbed(
          new EmbedBuilder()
            .setColor('#abcdef')
            .setTitle('Example Embed')
            .setThumbnail('https://example.com/thumb.jpg')
            .addField('Field 1', 'Value 1', true)
            .addField('Field 2', 'Value 2', true)
            .setImage('https://example.com/image.jpg')
            .setFooter('Example footer'),
        ),
    );
  }
}
```

## Ví dụ Form với EmbedBuilder

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  AutoContext,
  SmartMessage,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from '@n0xgg04/nezon';

@Injectable()
export class FormHandler {
  @Command('form')
  async onFormDemo(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
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
            .addSelectField('Type', 'type', [
              { label: 'Single choice', value: 'SINGLE' },
              { label: 'Multiple choice', value: 'MULTIPLE' },
            ], 'SINGLE')
            .setFooter('Powered by Mezon'),
        )
        .addButton(
          new ButtonBuilder()
            .setLabel('Create')
            .setStyle(ButtonStyle.Success),
        ),
    );
  }
}
```

## Named Parameters trong Component

Component hỗ trợ RESTful pattern với named parameters:

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

## SmartMessage builder

- `SmartMessage.text(content)` - Dựng payload text cơ bản
- `SmartMessage.system(content)` - Áp dụng markdown triple (`EMarkdownType.TRIPLE`) cho toàn bộ nội dung
- `SmartMessage.image(url, { alt, filename })` - Hỗ trợ đính kèm ảnh
- `SmartMessage.voice(url, { transcript })` - Hỗ trợ đính kèm voice
- `SmartMessage.build()` - Tạo SmartMessage rỗng
- `.addButton(button)` - Thêm button (tự động group thành action rows)
- `.addImage(url, options)` - Thêm ảnh attachment
- `.addFile(url, filename, filetype, options)` - Thêm file attachment
- `.addEmbed(embed)` - Thêm embed

## ButtonBuilder API

- `.setCustomId(id)` - Set custom ID (không thể dùng cùng với `.onClick()`)
- `.setLabel(label)` - Set label hiển thị
- `.setStyle(style)` - Set style (ButtonStyle.Primary, Secondary, Success, Danger, Link)
- `.setDisabled(disabled)` - Set disabled state
- `.setURL(url)` - Set URL cho link button
- `.onClick(handler)` - Set inline click handler (tự động generate ID, không thể dùng cùng với `.setCustomId()`)

## EmbedBuilder API

- `.setColor(color)` - Set màu embed (hex string)
- `.setTitle(title)` - Set tiêu đề
- `.setURL(url)` - Set URL cho title
- `.setAuthor(name, iconUrl, url)` - Set author
- `.setDescription(description)` - Set mô tả
- `.setThumbnail(url)` - Set thumbnail
- `.addField(name, value, inline?)` - Thêm field
- `.setImage(url)` - Set ảnh lớn
- `.setTimestamp(timestamp?)` - Set timestamp (mặc định là now)
- `.setFooter(text, iconUrl?)` - Set footer
- `.addTextField(name, inputId, options)` - Thêm text input field trong embed
- `.addSelectField(name, inputId, options, selectedValue?)` - Thêm select field trong embed

## Ví dụ module hoàn chỉnh

Repo đã kèm ứng dụng mẫu tại `apps/mebot`. Bạn có thể chạy thử:

```bash
cd apps/mebot
yarn install
yarn start
```

Đừng quên set `MEZON_TOKEN` và `MEZON_BOT_ID` vào biến môi trường.

## Góp ý & phát triển

- Mở issue hoặc gửi PR nếu bạn muốn bổ sung decorator mới, cải thiện type, hoặc hỗ trợ thêm loại component.
- Kiểm tra `apps/mebot` để tham khảo cách kết hợp nhiều decorator.

Chúc bạn xây dựng bot Mezon thật nhanh với Nezon! 🚀
