# Nezon

Monorepo chứa thư viện `@n0xgg04/nezon` và tài liệu đi kèm.

## Cấu trúc chính

- `apps/nezon`: Library Nezon (NestJS module + decorator).
- `apps/mebot`: Ứng dụng mẫu NestJS sử dụng Nezon.
- `apps/docs`: Tài liệu Docusaurus.

## Tính năng nổi bật của Nezon

- Decorator-first (`@Command`, `@Component`, `@On`, `@Once`).
- Decorator tham số typed (`@Message`, `@Channel`, `@User`, ...).
- Namespace `Nezon` cung cấp alias type (`Nezon.Message`, `Nezon.Channel`, ...).
- Event bridge phát toàn bộ sự kiện `mezon-sdk` qua `EventEmitter2`.
- Lifecycle service tự động đăng nhập bot, bind/unbind listener và dọn dẹp.

## Ví dụ nhanh

```ts
import { Injectable } from '@nestjs/common';
import { Command, Args, Message } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';

@Injectable()
export class PingHandler {
  @Command({ name: 'ping' })
  async onPing(@Args() args: Nezon.Args, @Message() message?: Nezon.Message) {
    if (!message) return;
    await message.reply({ t: args.join(' ') || 'pong' });
  }
}
```

## Scripts hữu ích

Monorepo dùng Yarn 1 + Turbo:

```bash
yarn install        # cài dependencies

# build 
yarn workspace @n0xgg04/nezon run build

# chạy docs dev
yarn workspace docs run start

# build docs static
yarn workspace docs run build
```

## Deploy docs lên Vercel

- `vercel.json` đã cấu hình dùng `apps/docs`.
- Build command: `yarn --cwd apps/docs install && yarn --cwd apps/docs build`.
- Output directory: `apps/docs/build` (được Vercel hiểu đúng nhờ cấu hình).

Push lên branch và kích hoạt deploy trong Vercel để xuất bản tài liệu.
