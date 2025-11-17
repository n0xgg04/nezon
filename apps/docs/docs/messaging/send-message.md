---
title: Gửi Tin Nhắn
sidebar_position: 6
description: Các cách reply người dùng, gửi vào channel khác, gửi DM hoặc kết hợp trực tiếp Mezon SDK với SmartMessage.
---

# Gửi Tin Nhắn

Sau khi xây dựng nội dung bằng `SmartMessage`, bạn có nhiều lựa chọn để phát đi:

1. **ManagedMessage** – trả lời hoặc cập nhật chính message người dùng đã tương tác.
2. **ChannelHelper** – gửi một message hoàn toàn mới vào channel hiện tại hoặc channel khác.
3. **DMHelper** / `ManagedMessage.sendDM()` – gửi tin nhắn riêng cho user.
4. **Mezon Client thuần** – dùng `client.channels.fetch(channelId).send(...)` kết hợp `SmartMessage.toJSON()`.

## 1. ManagedMessage (AutoContext `'message'`)

`@AutoContext()` trả về tuple `[managedMessage, dmHelper, channelHelper]`. Chỉ cần destructuring phần bạn cần.

```ts
@Command('reply')
async reply(
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(Nezon.SmartMessage.text('Đã nhận lệnh!'));
}

@Component('/task/finish/:id')
async finish(
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.update(Nezon.SmartMessage.text('✅ Task đã hoàn thành!'));
}
```

- `reply` → tạo message mới dưới dạng reply.
- `update` / `delete` chỉ áp dụng với message do bot gửi.
- `sendDM()` gửi tin nhắn riêng cho người đã tương tác (xem mục 3).

## 2. ChannelHelper (AutoContext `'channel'`)

ChannelHelper cho phép gửi **message mới** vào channel, không phụ thuộc message gốc. Bạn cũng có thể tìm channel khác.

```ts
@Command('broadcast')
async broadcast(@AutoContext('channel') channel: Nezon.AutoContextType.Channel) {
  if (!channel) return;
  await channel.send(Nezon.SmartMessage.text('Thông báo toàn kênh!'));
}

@Command('broadcast-to')
async broadcastTo(
  @Args() args: Nezon.Args,
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  const [channelId] = args;
  if (!channel || !channelId) return;
  await channel
    .find(channelId)
    .send(Nezon.SmartMessage.text(`Gửi tới channel ${channelId}`));
}
```

## 3. Gửi DM

Bạn có hai lựa chọn:

- **DMHelper** (`@AutoContext('dm')`) – chủ động gửi DM cho `userId` bất kỳ.

```ts
@Command('dm')
async dmUser(
  @Args() args: Nezon.Args,
  @AutoContext('dm') dm: Nezon.AutoContextType.DM,
) {
  const [userId] = args;
  if (!userId) return;
  await dm.send(userId, Nezon.SmartMessage.text('Xin chào từ bot!'));
}
```

- **ManagedMessage.sendDM()** – gửi DM lại chính người đang tương tác.

```ts
@Command('dm-me')
async dmMe(@AutoContext('message') message: Nezon.AutoContextType.Message) {
  await message.sendDM(Nezon.SmartMessage.text('Hello from DM!'));
}
```

Chi tiết thêm: phần **Gửi DM** trong trang này (DMHelper và `sendDM()`).

## 4. Dùng Mezon Client trực tiếp

Trong một số trường hợp bạn muốn gọi API thuần, vẫn có thể tái sử dụng payload từ `SmartMessage.toJSON()`.

```ts
@NezonUtils() utils: Nezon.NezonUtilsService;

async sendRaw(channelId: string) {
  const client = this.utils['client']; // hoặc inject @MezonClient
  const channel = await client.channels.fetch(channelId);
  const payload = Nezon.SmartMessage.text('Raw via client').toJSON();
  await channel.send(payload.content, payload.mentions, payload.attachments);
}
```

> Gợi ý: nếu đã dùng ChannelHelper/DMHelper thì không cần tự xử lý `toJSON()`. Tuy nhiên khi bạn chạy ở background job hoặc gửi tới nhiều channel không thuộc AutoContext, đây là cách linh hoạt hơn.

## Quy tắc chọn phương án

| Tình huống                                     | Nên dùng                                |
| ---------------------------------------------- | --------------------------------------- |
| Reply ngay dưới tin nhắn người dùng            | `ManagedMessage.reply()`                |
| Update/hủy message do bot gửi                  | `ManagedMessage.update()` / `.delete()` |
| Gửi thông báo mới trong channel đang hoạt động | `ChannelHelper.send()`                  |
| Đẩy thông báo tới channel khác                 | `ChannelHelper.find(id).send(...)`      |
| Gửi DM cho user bất kỳ                         | `DMHelper.send(userId, message)`        |
| Gửi DM tới người đang tương tác                | `ManagedMessage.sendDM()`               |
| Tác vụ nền / batch gửi nhiều channel           | Mezon Client + `SmartMessage.toJSON()`  |

Tiếp tục đọc:

- [Nezon Utils Service](../nezon/utils.md) để biết cách fetch dữ liệu bổ sung (user, channel, clan...).
- [Danh sách decorator](../decorators.md) để nắm rõ các helper bạn có thể inject.
