---
id: decorators
title: Danh sách Decorators
sidebar_position: 5
---

Danh sách đầy đủ các decorators trong Nezon và cách sử dụng.

## Command Decorators

### @Command

Định nghĩa text command.

```ts
@Command(name: string | NezonCommandOptions)
```

**Type:**

```ts
interface NezonCommandOptions {
  name: string;
  aliases?: string[];
  prefix?: string;
}
```

**Ví dụ:**

```ts
@Command('ping')
@Command({ name: 'ping', aliases: ['pong'], prefix: '!' })
```

**Xem thêm:** [@Command](/docs/interaction/command)

## Component Decorators

### @Component

Xử lý component interactions (buttons, selects, etc.).

```ts
@Component(options: NezonComponentOptions | string)
```

**Type:**

```ts
interface NezonComponentOptions {
  pattern: string;
  id?: string;
}
```

**Ví dụ:**

```ts
@Component('click/confirm')
@Component({ pattern: '/user/:id/:action' })
```

**Xem thêm:** [@Component](/docs/interaction/component)

## Event Decorators

### @On

Lắng nghe event mỗi lần xảy ra.

```ts
@On(event: string)
```

**Ví dụ:**

```ts
@On(Events.ChannelMessage)
```

**Xem thêm:** [@On, @Once](/docs/interaction/events)

### @OnMention

Lắng nghe riêng trường hợp **bot được mention** trong `ChannelMessage`.

```ts
@OnMention()
```

**Cách hoạt động:**

- Nội bộ Nezon lắng nghe `Events.ChannelMessage`
- Với mỗi message, Nezon kiểm tra `message.mentions` có phần tử nào có `user_id === botId` (config từ `NezonModule.forRoot({ botId })`) hay không
- Nếu có, Nezon emit event nội bộ `nezon:mention` và gọi tất cả handler được đánh dấu `@OnMention()`

**Ví dụ:**

```ts
@OnMention()
async onBotMention(
  @MessageContent() content: string,
  @User('username') username: string | undefined,
) {
  console.log(`Bot được mention bởi ${username}: ${content}`);
}
```

> Bạn vẫn có thể dùng đầy đủ các decorator param trong `@OnMention()` giống như `@On()` / `@Once()`:  
> `@ChannelMessagePayload()`, `@EventPayload()`, `@Channel()`, `@Clan()`, `@User()`, `@MessageContent()`, `@Mentions()`, `@Attachments()`, `@Client()`, `@AutoContext()`, `@NezonUtils()`, ...

### @Once

Lắng nghe event một lần duy nhất.

```ts
@Once(event: string)
```

**Ví dụ:**

```ts
@Once('Ready')
```

**Xem thêm:** [@On, @Once](/docs/interaction/events)

## Parameter Decorators

### @Args

Lấy tất cả arguments từ command.

```ts
@Args(): ParameterDecorator
// Trả về: Nezon.Args = string[]
```

**Ví dụ:**

```ts
@Command('greet')
async greet(@Args() args: Nezon.Args) {
  // args = ['John', 'Doe']
}
```

### @Arg

Lấy argument cụ thể theo index.

```ts
@Arg(index: number): ParameterDecorator
// Trả về: string | undefined
```

**Ví dụ:**

```ts
@Command('greet')
async greet(@Arg(0) name: string | undefined) {
  // name = 'John'
}
```

### @Attachments

Lấy danh sách file đính kèm từ message.

```ts
@Attachments(index?: number): ParameterDecorator
// Không có index: Nezon.Attachments
// Có index: Nezon.Attachment | undefined
```

**Ví dụ:**

```ts
@Command('inspect')
async inspect(
  @Attachments() files: Nezon.Attachments,
  @Attachments(0) firstFile: Nezon.Attachment | undefined,
) {
  // ...
}
```

### @Mentions

Lấy danh sách mentions từ message.

```ts
@Mentions(index?: number): ParameterDecorator
// Không có index: Nezon.Mentions
// Có index: Nezon.Mention | undefined
```

**Ví dụ:**

```ts
@Command('inspect')
async inspectMentions(
  @Mentions() mentions: Nezon.Mentions,
  @Mentions(0) firstMention: Nezon.Mention | undefined,
) {
  // ...
}
```

### @MessageContent

Lấy toàn bộ nội dung message (bao gồm cả command).

```ts
@MessageContent(): ParameterDecorator
// Trả về: string | undefined
```

**Ví dụ:**

```ts
@Command('echo')
async echo(@MessageContent() content: string | undefined) {
  // content = '*echo Hello World'
}
```

### @AutoContext

Lấy ManagedMessage, DMHelper và ChannelHelper với các methods tiện dụng.

```ts
@AutoContext(key?: 'message' | 'dm' | 'channel'): ParameterDecorator
// Không có key: Trả về Nezon.AutoContext = [ManagedMessage, DMHelper, ChannelHelper]
// Với key 'message': Trả về Nezon.AutoContextType.Message
// Với key 'dm': Trả về Nezon.AutoContextType.DM
// Với key 'channel': Trả về Nezon.AutoContextType.Channel
```

**Cách 1: Lấy toàn bộ tuple (backward compatible)**

```ts
@Command('ping')
async ping(@AutoContext() [managedMessage]: Nezon.AutoContext) {
  await managedMessage.reply(SmartMessage.text('pong!'));
}
```

**Cách 2: Lấy phần tử cụ thể bằng key**

```ts
@Command('dm')
async sendDM(
  @Args() args: Nezon.Args,
  @AutoContext('message') managedMessage: Nezon.AutoContextType.Message,
  @AutoContext('dm') dm: Nezon.AutoContextType.DM,
) {
  const userId = args[0];
  await dm.send(userId, SmartMessage.text('Hello via DM!'));
}
```

**Ví dụ 3: Channel helper**

```ts
@Command('broadcast')
async broadcast(
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  if (!channel) return;
  await channel.send(SmartMessage.text('Tin nhắn mới trong channel hiện tại!'));
}

@Command('broadcast-to')
async broadcastTo(
  @Args() args: Nezon.Args,
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  const [channelId] = args;
  if (!channel || !channelId) {
    return;
  }
  await channel
    .find(channelId)
    .send(SmartMessage.text(`Gửi thông báo tới channel ${channelId}`));
}
```

**Type definitions:**

- `Nezon.AutoContext` - Tuple type `[ManagedMessage, DMHelper, ChannelHelper]`
- `Nezon.AutoContextType.Message` - Type cho ManagedMessage
- `Nezon.AutoContextType.DM` - Type cho DMHelper
- `Nezon.AutoContextType.Channel` - Type cho ChannelHelper

> **Lưu ý về ManagedMessage**
>
> `ManagedMessage` đại diện cho message của context hiện tại:
>
> - Với **text commands**, đây chính là **tin nhắn người dùng gửi**, nên bạn chỉ nên dùng `reply()`, `sendDM()`, hoặc `react()`. Các method như `update()`/`delete()` sẽ **throw error** nếu không phải message của bot.
> - Với **component handlers** (hoặc khi dùng `@ComponentTarget`), `ManagedMessage` trỏ tới **message do bot gửi**, vì vậy bạn có thể gọi `update()` hoặc `delete()` để chỉnh sửa/xóa message của bot.
> - **Reaction methods** (`react()`, `addReaction()`, `removeReaction()`) hoạt động với cả message của user và bot.
>
> Best practice: đặt tên biến là `managedMessage` hoặc tương tự để phân biệt với raw payload (`ChannelMessagePayload`).

> **Lưu ý về ChannelHelper**
>
> `ChannelHelper` trả về `null` trong bối cảnh event (`@On`/`@Once`) vì không có channel cụ thể. Trong commands/components, channel luôn tồn tại.

### @Message

Lấy Message entity từ Mezon SDK.

```ts
@Message(key?: string): ParameterDecorator
// Trả về: Nezon.Message | undefined
// Nếu có key: trả về message[key]
```

**Ví dụ:**

```ts
@Command('info')
async info(@Message() message: Nezon.Message | undefined) {
  // message entity
}

@Command('info')
async info(@Message('id') messageId: string | undefined) {
  // message.id
}
```

### @ChannelMessagePayload

Lấy raw ChannelMessage payload.

```ts
@ChannelMessagePayload(): ParameterDecorator
// Trả về: Nezon.ChannelMessage
```

**Ví dụ:**

```ts
@On(Events.ChannelMessage)
async onMessage(@ChannelMessagePayload() payload: Nezon.ChannelMessage) {
  // payload.message_id, payload.channel_id, etc.
}
```

### @Channel

Lấy Channel entity.

```ts
@Channel(key?: string): ParameterDecorator
// Trả về: Nezon.Channel | undefined
// Nếu có key: trả về channel[key]
```

**Ví dụ:**

```ts
@Command('info')
async info(@Channel() channel: Nezon.Channel | undefined) {
  // channel entity
}

@Command('info')
async info(@Channel('name') channelName: string | undefined) {
  // channel.name
}
```

### @Clan

Lấy Clan entity.

```ts
@Clan(): ParameterDecorator
// Trả về: Nezon.Clan | undefined
```

**Ví dụ:**

```ts
@Command('info')
async info(@Clan() clan: Nezon.Clan | undefined) {
  // clan entity
}
```

### @User

Lấy User entity.

```ts
@User(key?: string): ParameterDecorator
// Trả về: Nezon.User | undefined
// Nếu có key: trả về user[key]
```

**Ví dụ:**

```ts
@Command('info')
async info(@User() user: Nezon.User | undefined) {
  // user entity
}

@Command('info')
async info(@User('username') username: string | undefined) {
  // user.username
}
```

### @Client

Lấy MezonClient instance.

```ts
@Client(): ParameterDecorator
// Trả về: Nezon.Client = MezonClient
```

**Ví dụ:**

```ts
@Command('info')
async info(@Client() client: Nezon.Client) {
  // client instance
}
```

### @ComponentPayload

Lấy raw ComponentPayload từ button click.

```ts
@ComponentPayload(): ParameterDecorator
// Trả về: Nezon.ComponentPayload = MessageButtonClicked
```

**Ví dụ:**

```ts
@Component('click/confirm')
async confirm(@ComponentPayload() payload: Nezon.ComponentPayload) {
  // payload.button_id, payload.user_id, etc.
}
```

### @ComponentParams

Lấy tất cả parameters từ component pattern.

```ts
@ComponentParams(paramName?: string): ParameterDecorator
// Không có paramName: trả về tất cả params
// Có paramName: trả về param cụ thể
// Trả về: Nezon.ComponentParams = string[] | Record<string, string>
```

**Ví dụ:**

```ts
@Component({ pattern: '/user/:id/:action' })
async action(
  @ComponentParams() allParams: Record<string, string> | undefined,
  @ComponentParams('id') userId: string | undefined,
) {
  // allParams = { id: '123', action: 'kick' }
  // userId = '123'
}
```

### @ComponentParam

Lấy parameter cụ thể theo index hoặc name.

```ts
@ComponentParam(positionOrName: number | string): ParameterDecorator
// number: lấy theo index
// string: lấy theo tên (named parameter)
// Trả về: string | undefined
```

**Ví dụ:**

```ts
@Component({ pattern: '/user/:id/:action' })
async action(
  @ComponentParam(0) firstParam: string | undefined, // '123'
  @ComponentParam('id') userId: string | undefined, // '123'
  @ComponentParam('action') action: string | undefined, // 'kick'
) {
  // ...
}
```

### @ComponentTarget

Lấy Message entity đã được cache từ component click.

```ts
@ComponentTarget(): ParameterDecorator
// Trả về: Nezon.Message | undefined
```

**Ví dụ:**

```ts
@Component('click/confirm')
async confirm(@ComponentTarget() target: Nezon.Message | undefined) {
  // target message đã được cache
}
```

### @FormData

Đọc dữ liệu form (các input được tạo bằng `EmbedBuilder.addTextField/addSelectField`) khi người dùng submit thông qua button/component.

```ts
@FormData(field?: string): ParameterDecorator
// Không có field: trả về Record<string, string>
// Có field: trả về giá trị cụ thể (string | undefined)
```

```ts
@Component('/poll/create')
async onPollCreate(
  @FormData() form: Nezon.FormData | undefined,
  @FormData('title') title: string | undefined,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(
    SmartMessage.text(
      [
        '🎯 Poll form data:',
        `Tiêu đề: ${title ?? 'N/A'}`,
        `Option 1: ${form?.option_1 ?? 'N/A'}`,
        `Expired: ${form?.expired ?? '168'} giờ`,
      ].join('\n'),
    ),
  );
}
```

> Khi dùng `ButtonBuilder.onClick`, bạn cũng có thể đọc `context.formData`.

### @EventPayload

Lấy event payload từ @On hoặc @Once handlers.

```ts
@EventPayload(): ParameterDecorator
// Trả về: Event payload (type depends on event)
```

**Ví dụ:**

```ts
@On(Events.TokenSend)
async onTokenSend(@EventPayload() payload: Nezon.TokenSendPayload) {
  // payload: TokenSentEvent
}

@On(Events.AddClanUser)
async onAddClanUser(@EventPayload() payload: Nezon.AddClanUserPayload) {
  // payload: { user_id: string; clan_id: string; ... }
}
```

## Bảng tóm tắt

| Decorator                | Type      | Use Case                   |
| ------------------------ | --------- | -------------------------- |
| `@Command`               | Method    | Định nghĩa command         |
| `@Component`             | Method    | Xử lý component            |
| `@On`                    | Method    | Lắng nghe event            |
| `@Once`                  | Method    | Lắng nghe event một lần    |
| `@Args`                  | Parameter | Tất cả arguments           |
| `@Arg`                   | Parameter | Argument cụ thể            |
| `@MessageContent`        | Parameter | Nội dung message           |
| `@AutoContext`           | Parameter | ManagedMessage             |
| `@Message`               | Parameter | Message entity             |
| `@ChannelMessagePayload` | Parameter | Raw message payload        |
| `@Channel`               | Parameter | Channel entity             |
| `@Clan`                  | Parameter | Clan entity                |
| `@User`                  | Parameter | User entity                |
| `@Client`                | Parameter | MezonClient                |
| `@ComponentPayload`      | Parameter | Raw component payload      |
| `@ComponentParams`       | Parameter | Component parameters       |
| `@ComponentParam`        | Parameter | Component parameter cụ thể |
| `@ComponentTarget`       | Parameter | Target message (cached)    |
| `@EventPayload`          | Parameter | Event payload (typed)      |
| `@MezonClient`           | Parameter | MezonClient instance       |
| `@NezonUtils`            | Parameter | NezonUtilsService instance |

## Xem thêm

- [@Command](/docs/interaction/command) - Chi tiết về Command
- [@Component](/docs/interaction/component) - Chi tiết về Component
- [@On, @Once](/docs/interaction/events) - Chi tiết về Events
- [Examples](/docs/examples) - Ví dụ sử dụng
