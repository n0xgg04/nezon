---
title: Sending Messages
sidebar_position: 6
description: Ways to reply to users, send to other channels, send DM, or combine raw Mezon SDK with SmartMessage.
---

# Sending Messages

After building content with `SmartMessage`, you have many options to send it:

1. **ManagedMessage** – reply to or update the exact message the user interacted with.
2. **ChannelHelper** – send a completely new message to the current channel or another channel.
3. **DMHelper** / `ManagedMessage.sendDM()` – send a private message to a user.
4. **Raw Mezon Client** – use `client.channels.fetch(channelId).send(...)` combined with `SmartMessage.toJSON()`.

## 1. ManagedMessage (AutoContext `'message'`)

`@AutoContext()` returns tuple `[managedMessage, dmHelper, channelHelper]`. Just destructure the part you need.

```ts
@Command('reply')
async reply(
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(Nezon.SmartMessage.text('Command received!'));
}

@Component('/task/finish/:id')
async finish(
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.update(Nezon.SmartMessage.text('✅ Task completed!'));
}
```

- `reply` → creates a new message as a reply.
- `update` / `delete` only apply to messages sent by the bot.
- `sendDM()` sends a private message to the person who interacted (see section 3).

## 2. ChannelHelper (AutoContext `'channel'`)

ChannelHelper allows sending **new messages** to a channel, independent of the original message. You can also find other channels.

```ts
@Command('broadcast')
async broadcast(@AutoContext('channel') channel: Nezon.AutoContextType.Channel) {
  if (!channel) return;
  await channel.send(Nezon.SmartMessage.text('Channel-wide announcement!'));
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
    .send(Nezon.SmartMessage.text(`Sending to channel ${channelId}`));
}
```

## 3. Send DM

You have two options:

- **DMHelper** (`@AutoContext('dm')`) – actively send DM to any `userId`.

```ts
@Command('dm')
async dmUser(
  @Args() args: Nezon.Args,
  @AutoContext('dm') dm: Nezon.AutoContextType.DM,
) {
  const [userId] = args;
  if (!userId) return;
  await dm.send(userId, Nezon.SmartMessage.text('Hello from bot!'));
}
```

- **ManagedMessage.sendDM()** – send DM back to the person currently interacting.

```ts
@Command('dm-me')
async dmMe(@AutoContext('message') message: Nezon.AutoContextType.Message) {
  await message.sendDM(Nezon.SmartMessage.text('Hello from DM!'));
}
```

More details: **Send DM** section in this page (DMHelper and `sendDM()`).

## 4. Use Mezon Client Directly

In some cases you want to call the raw API, you can still reuse the payload from `SmartMessage.toJSON()`.

```ts
@NezonUtils() utils: Nezon.NezonUtilsService;

async sendRaw(channelId: string) {
  const client = this.utils['client']; // or inject @MezonClient
  const channel = await client.channels.fetch(channelId);
  const payload = Nezon.SmartMessage.text('Raw via client').toJSON();
  await channel.send(payload.content, payload.mentions, payload.attachments);
}
```

> Tip: If you're already using ChannelHelper/DMHelper, you don't need to handle `toJSON()` yourself. However, when running in background jobs or sending to multiple channels not in AutoContext, this is a more flexible approach.

## Choosing the Right Method

| Situation                                          | Should Use                              |
| -------------------------------------------------- | --------------------------------------- |
| Reply directly under user's message                | `ManagedMessage.reply()`                |
| Update/delete message sent by bot                  | `ManagedMessage.update()` / `.delete()` |
| Send new announcement in current active channel    | `ChannelHelper.send()`                  |
| Push announcement to another channel               | `ChannelHelper.find(id).send(...)`      |
| Send DM to any user                                | `DMHelper.send(userId, message)`        |
| Send DM to person currently interacting            | `ManagedMessage.sendDM()`               |
| Background tasks / batch send to multiple channels | Mezon Client + `SmartMessage.toJSON()`  |

Continue reading:

- [Nezon Utils Service](../nezon/utils.md) to learn how to fetch additional data (user, channel, clan...).
- [Decorator List](../decorators.md) to understand all helpers you can inject.
