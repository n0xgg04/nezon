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

Lấy ManagedMessage với các methods tiện dụng.

```ts
@AutoContext(): ParameterDecorator
// Trả về: Nezon.AutoContext = [ManagedMessage]
```

**Ví dụ:**
```ts
@Command('ping')
async ping(@AutoContext() [message]: Nezon.AutoContext) {
  await message.reply(SmartMessage.text('pong!'));
  await message.update(SmartMessage.text('updated!'));
  await message.delete();
}
```

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

| Decorator | Type | Use Case |
|-----------|------|----------|
| `@Command` | Method | Định nghĩa command |
| `@Component` | Method | Xử lý component |
| `@On` | Method | Lắng nghe event |
| `@Once` | Method | Lắng nghe event một lần |
| `@Args` | Parameter | Tất cả arguments |
| `@Arg` | Parameter | Argument cụ thể |
| `@MessageContent` | Parameter | Nội dung message |
| `@AutoContext` | Parameter | ManagedMessage |
| `@Message` | Parameter | Message entity |
| `@ChannelMessagePayload` | Parameter | Raw message payload |
| `@Channel` | Parameter | Channel entity |
| `@Clan` | Parameter | Clan entity |
| `@User` | Parameter | User entity |
| `@Client` | Parameter | MezonClient |
| `@ComponentPayload` | Parameter | Raw component payload |
| `@ComponentParams` | Parameter | Component parameters |
| `@ComponentParam` | Parameter | Component parameter cụ thể |
| `@ComponentTarget` | Parameter | Target message (cached) |
| `@EventPayload` | Parameter | Event payload (typed) |

## Xem thêm

- [@Command](/docs/interaction/command) - Chi tiết về Command
- [@Component](/docs/interaction/component) - Chi tiết về Component
- [@On, @Once](/docs/interaction/events) - Chi tiết về Events
- [Examples](/docs/examples) - Ví dụ sử dụng

