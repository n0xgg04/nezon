# Nezon

Nezon là thư viện NestJS giúp xây dựng bot cho nền tảng Mezon nhanh chóng, tương tự trải nghiệm của Necord với Discord.

## Tính năng chính

- **Decorator command**: Định nghĩa text command bằng `@Command`, hỗ trợ alias, prefix riêng và tự động phân tích tham số.
- **Decorator component**: Bắt sự kiện nút bấm (và các component khác) qua `@Component`, hỗ trợ pattern/regex cho `button_id`, kèm `@ComponentTarget` để lấy ngay `Message` đã cache.
- **Injection ngữ cảnh typed**: Các decorator `@NezonMessage`, `@Channel`, `@Clan`, `@NezonUser`, `@MessageContent`, `@Args`… trả về đối tượng typed từ `mezon-sdk`.
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
import { Command, Args, NezonMessage, MessageContent } from '@n0xgg04/nezon';
import { Message as MezonMessage } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';

@Injectable()
export class PingHandler {
  @Command({ name: 'ping', aliases: ['pong'] })
  async onPing(
    @Args() args: string[],
    @MessageContent() content: string,
    @NezonMessage() message?: MezonMessage,
  ) {
    if (!message) {
      return;
    }
    const suffix = args.length ? args.join(' ') : 'pong';
    await message.reply({ t: `✅ ${suffix} (${content})` });
  }
}
```

## Ví dụ button component

```ts
import { Injectable } from '@nestjs/common';
import {
  Command,
  Component,
  ComponentPayload,
  Client,
  ComponentTarget,
  NezonMessage,
} from '@n0xgg04/nezon';
import {
  EButtonMessageStyle,
  EMessageComponentType,
  MezonClient,
} from 'mezon-sdk';
import { Message as MezonMessage } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

@Injectable()
export class ButtonHandler {
  @Command('button')
  async askForConfirm(@NezonMessage() message?: MezonMessage) {
    if (!message) {
      return;
    }
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
    @ComponentPayload() payload: MessageButtonClicked,
    @Client() client: MezonClient,
    @ComponentTarget() target?: MezonMessage,
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

## Góp ý & phát triển

- Mở issue hoặc gửi PR nếu bạn muốn bổ sung decorator mới, cải thiện type, hoặc hỗ trợ thêm loại component.
- Kiểm tra `apps/mebot` để tham khảo cách kết hợp nhiều decorator.

Chúc bạn xây dựng bot Mezon thật nhanh với Nezon! 🚀
