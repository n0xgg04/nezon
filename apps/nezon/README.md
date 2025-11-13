# Nezon

Nezon là thư viện NestJS giúp xây dựng bot cho nền tảng Mezon nhanh chóng, tương tự trải nghiệm của Necord với Discord.

## Tính năng chính

- **Decorator command**: Định nghĩa text command bằng `@Command`, hỗ trợ alias, prefix riêng và tự động phân tích tham số.
- **Decorator component**: Bắt sự kiện nút bấm (và các component khác) qua `@Component`, hỗ trợ pattern/regex cho `button_id`, kèm `@ComponentTarget` để lấy ngay `Message` đã cache.
- **Injection ngữ cảnh typed**: Các decorator `@Message`, `@Channel`, `@Clan`, `@User`, `@MessageContent`, `@Args`, `@AutoContext`… trả về đối tượng typed từ `mezon-sdk` hoặc helper của Nezon. Namespace `Nezon` cung cấp alias type (`Nezon.Message`, `Nezon.AutoContext`, ...).
- **SmartMessage builder**: `SmartMessage.text/system/image/voice` giúp dựng payload gửi tin nhắn mà không phải thao tác trực tiếp với `ChannelMessageContent`.
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

## Ví dụ button component

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  AutoContext,
  Component,
  ComponentPayload,
  Client,
  ComponentTarget,
} from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { EButtonMessageStyle, EMessageComponentType } from 'mezon-sdk';

@Injectable()
export class ButtonHandler {
  @Command('button')
  async askForConfirm(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply({
      t: 'Nhấn nút để xác nhận.',
      components: [
        {
          components: [
            {
              id: `demo_button_success_${message.id}`,
              type: EMessageComponentType.BUTTON,
              component: {
                label: 'Confirm',
                style: EButtonMessageStyle.SUCCESS,
              },
            },
          ],
        },
      ],
    });
  }

  @Component({ pattern: '^demo_button_success_.+' })
  async onConfirm(
    @ComponentPayload() payload: Nezon.ComponentPayload,
    @Client() client: Nezon.Client,
    @ComponentTarget() target?: Nezon.Message,
  ) {
    const message =
      target ??
      (await client.channels
        .fetch(payload.channel_id)
        .then((ch) => ch.messages.fetch(payload.message_id)));

    await message.reply({ t: `Đã xác nhận, user ${payload.user_id}` });
  }
}
```

## Ví dụ module hoàn chỉnh

Repo đã kèm ứng dụng mẫu tại `apps/mebot`. Bạn có thể chạy thử:

```bash
cd apps/mebot
yarn install
yarn start
```

Đừng quên set `MEZON_TOKEN` và `MEZON_BOT_ID` vào biến môi trường.

## SmartMessage builder

- `Nezon.SmartMessage.text(content)` dựng payload text cơ bản.
- `Nezon.SmartMessage.system(content)` áp dụng markdown triple (`EMarkdownType.TRIPLE`) cho toàn bộ nội dung.
- `Nezon.SmartMessage.image(url, { alt, filename })` và `Nezon.SmartMessage.voice(url, { transcript })` hỗ trợ đính kèm media.
- Trả về object có thể truyền thẳng vào `message.reply(...)` khi dùng `@AutoContext`.

## Góp ý & phát triển

- Mở issue hoặc gửi PR nếu bạn muốn bổ sung decorator mới, cải thiện type, hoặc hỗ trợ thêm loại component.
- Kiểm tra `apps/mebot` để tham khảo cách kết hợp nhiều decorator.

Chúc bạn xây dựng bot Mezon thật nhanh với Nezon! 🚀
