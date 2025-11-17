---
title: Lấy Thông Tin
sidebar_position: 3
description: Tổng hợp các decorator và helper để đọc payload, user, channel, clan, form inputs và component metadata.
---

# Lấy Thông Tin Từ Context

Nezon cung cấp nhiều decorator/di helper giúp bạn đọc nhanh dữ liệu từ command, component hoặc event payload. Dưới đây là checklist những trường phổ biến và link tới tài liệu chi tiết.

## Đọc nội dung tin nhắn

- `@MessageContent()` – lấy string raw (bao gồm prefix và command).
- `@ChannelMessagePayload()` – lấy toàn bộ payload `Nezon.ChannelMessage`.

```ts
@Command('echo')
async onEcho(
  @MessageContent() content: string | undefined,
  @ChannelMessagePayload() payload: Nezon.ChannelMessage,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  const clean = content?.replace('*echo', '').trim() ?? 'Nothing';
  await message.reply(Nezon.SmartMessage.text(clean));
  console.log('original payload id:', payload.message_id);
}
```

Xem thêm: [Text Message](../message-template/text-message.md#đọc-noi-dung) – phần “MessageContent” giải thích chi tiết.

## Channel hiện tại & channel khác

- `@Channel()` (hoặc `@Channel('name')`) – inject `TextChannel` từ command/component context.
- `@AutoContext('channel')` → ChannelHelper:
  - `.send(SmartMessage)` gửi message mới vào channel hiện tại.
  - `.find(channelId)` để bind sang channel khác (và tiếp tục `.send()`).

```ts
@Command('broadcast')
async broadcast(@AutoContext('channel') channel: Nezon.AutoContextType.Channel) {
  if (!channel) return;
  await channel.send(Nezon.SmartMessage.text('Thông báo ở channel hiện tại!'));
}

@Command('broadcast-to')
async broadcastTo(
  @Args() args: Nezon.Args,
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  const [targetChannelId] = args;
  if (!channel || !targetChannelId) return;
  await channel.find(targetChannelId).send(
    Nezon.SmartMessage.text(`Ping tới channel ${targetChannelId}`),
  );
}
```

## Clan

- `@Clan()` để inject `Nezon.Clan`.
- `@NezonUtils()` + `nezonUtils.getClan(id)` nếu cần fetch từ nơi khác.

> Gợi ý: Khi kết hợp với ChannelHelper `.find()`, bạn có thể dùng `clan?.channels.fetch` để lấy thêm channel theo id tùy biến.

## User info

- `@User()` – lấy đối tượng `Nezon.User` của sender/component user.
- `@User('username')`, `@User('display_name')`, ... để lấy field cụ thể.

```ts
@Command('whoami')
async whoAmI(@User() user?: Nezon.User, @AutoContext('message') message: Nezon.AutoContextType.Message) {
  await message.reply(
    Nezon.SmartMessage.text(`Bạn là ${user?.display_name ?? user?.username ?? 'unknown'}`),
  );
}
```

## Form data (embed inputs)

- `@FormData()` – trả về record các field (`Record<string, string>`).
- `@FormData('title')` – lấy trực tiếp giá trị một field.
- Trong `ButtonBuilder.onClick`, có thể đọc `context.formData`.

```ts
@Component('/poll/create')
async onPollCreate(
  @FormData() form: Nezon.FormData | undefined,
  @FormData('title') title: string | undefined,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(
    Nezon.SmartMessage.text(
      [
        '🎯 Poll form data:',
        `Title: ${title ?? 'N/A'}`,
        `Option 1: ${form?.option_1 ?? 'N/A'}`,
        `Expired: ${form?.expired ?? '168'} giờ`,
      ].join('\n'),
    ),
  );
}
```

> Form data được parse từ `payload.extra_data`. Nếu embed có `addTextField`/`addSelectField`, giá trị sẽ tự động vào form object.

## Component params & payload

- `@ComponentParams()` – lấy toàn bộ `params` đã parse từ customId.
- `@ComponentParams('id')` – lấy param cụ thể.
- `@ComponentPayload()` – inject `MessageButtonClicked` raw payload.

```ts
@Component({ pattern: '/user/:user_id/:action' })
async onUserAction(
  @ComponentParams('user_id') userId: string,
  @ComponentParams('action') action: string,
  @ComponentPayload() payload: Nezon.ComponentPayload,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(
    Nezon.SmartMessage.text(
      `User ${userId} thực hiện ${action}\nPayload channel: ${payload.channel_id}`,
    ),
  );
}
```

## Attachments

- `@Attachments()` trả về `Nezon.Attachments`.
- `@Attachments(0)` – lấy file đầu tiên.
- Khi dùng component/events, attachments nằm trong payload => decorator hoạt động tương tự.  
  Chi tiết: [Message Template → Attachments](../message-template/attachments.md).

## Mentions

- `@Mentions()` và `@Mentions(0)` – tương tự attachments.
- Hỗ trợ mention user & role (nhờ `SmartMessage.addMention`).  
  Xem thêm: [Message Template → Text](../message-template/text-message.md#mentions).

## Bảng tham chiếu nhanh

| Tác vụ           | Decorator/Helper                            | Ghi chú                                       |
| ---------------- | ------------------------------------------- | --------------------------------------------- |
| Message raw      | `@MessageContent`, `@ChannelMessagePayload` | Lấy string / payload đầy đủ                   |
| Channel hiện tại | `@Channel`, `@AutoContext('channel')`       | ChannelHelper có `send` + `find`              |
| Clan             | `@Clan`, `NezonUtils.getClan`               | `clan.channels.fetch` để lấy channel khác     |
| User             | `@User`                                     | Hỗ trợ `@User('username')`                    |
| Form inputs      | `@FormData`, `context.formData`             | Field ids từ `addTextField`, `addSelectField` |
| Component params | `@ComponentParams`, `@ComponentPayload`     | Dựa vào customId pattern                      |
| Attachments      | `@Attachments`, `@Attachments(0)`           | Trả về `Nezon.Attachments`                    |
| Mentions         | `@Mentions`, `@Mentions(0)`                 | Support user + role mention                   |

Tiếp theo: [Xử lý logic & event](logic-events.md) để biết cách dùng dữ liệu ở trên trong command/component/onClick.
