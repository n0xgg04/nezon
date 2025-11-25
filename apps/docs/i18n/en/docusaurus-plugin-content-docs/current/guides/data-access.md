---
title: Bot Context
sidebar_position: 3
description: Overview of decorators and helpers to read payload, user, channel, clan, form inputs, and component metadata.
---

# Reading Data from Context

Nezon provides many decorators/DI helpers to quickly read data from command, component, or event payloads. Below is a checklist of common fields and links to detailed documentation.

## Reading Message Content

- `@MessageContent()` – get raw string (including prefix and command).
- `@ChannelMessagePayload()` – get full `Nezon.ChannelMessage` payload.

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

See also: [Text Message](../message-template/text-message.md#reading-content) – "MessageContent" section explains in detail.

## Current Channel & Other Channels

- `@Channel()` (or `@Channel('name')`) – inject `TextChannel` from command/component context.
- `@AutoContext('channel')` → ChannelHelper:
  - `.send(SmartMessage)` sends a new message to the current channel.
  - `.find(channelId)` to bind to another channel (and continue `.send()`).

```ts
@Command('broadcast')
async broadcast(@AutoContext('channel') channel: Nezon.AutoContextType.Channel) {
  if (!channel) return;
  await channel.send(Nezon.SmartMessage.text('Announcement in current channel!'));
}

@Command('broadcast-to')
async broadcastTo(
  @Args() args: Nezon.Args,
  @AutoContext('channel') channel: Nezon.AutoContextType.Channel,
) {
  const [targetChannelId] = args;
  if (!channel || !targetChannelId) return;
  await channel.find(targetChannelId).send(
    Nezon.SmartMessage.text(`Ping to channel ${targetChannelId}`),
  );
}
```

## Clan

- `@Clan()` to inject `Nezon.Clan`.
- `@NezonUtils()` + `nezonUtils.getClan(id)` if you need to fetch from elsewhere.

> Tip: When combined with ChannelHelper `.find()`, you can use `clan?.channels.fetch` to get additional channels by custom id.

## User Info

- `@User()` – get `Nezon.User` object of sender/component user.
- `@User('username')`, `@User('display_name')`, ... to get a specific field.

```ts
@Command('whoami')
async whoAmI(@User() user?: Nezon.User, @AutoContext('message') message: Nezon.AutoContextType.Message) {
  await message.reply(
    Nezon.SmartMessage.text(`You are ${user?.display_name ?? user?.username ?? 'unknown'}`),
  );
}
```

## Form Data (Embed Inputs)

- `@FormData()` – returns record of fields (`Record<string, string>`).
- `@FormData('title')` – get value of a specific field directly.
- In `ButtonBuilder.onClick`, you can read `context.formData`.

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
        `Expired: ${form?.expired ?? '168'} hours`,
      ].join('\n'),
    ),
  );
}
```

> Form data is parsed from `payload.extra_data`. If the embed has `addTextField`/`addSelectField`, values will automatically be in the form object.

## Component Params & Payload

- `@ComponentParams()` – get all `params` parsed from customId.
- `@ComponentParams('id')` – get a specific param.
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
      `User ${userId} performed ${action}\nPayload channel: ${payload.channel_id}`,
    ),
  );
}
```

## Attachments

- `@Attachments()` returns `Nezon.Attachments`.
- `@Attachments(0)` – get the first file.
- When using components/events, attachments are in the payload => decorator works similarly.  
  Details: [Message Template → Attachments](../message-template/attachments.md).

## Mentions

- `@Mentions()` and `@Mentions(0)` – similar to attachments.
- Supports user & role mentions (via `SmartMessage.addMention`).  
  See also: [Message Template → Text](../message-template/text-message.md#mentions).

## Quick Reference Table

| Task             | Decorator/Helper                            | Notes                                           |
| ---------------- | ------------------------------------------- | ----------------------------------------------- |
| Message raw      | `@MessageContent`, `@ChannelMessagePayload` | Get string / full payload                       |
| Current channel  | `@Channel`, `@AutoContext('channel')`       | ChannelHelper has `send` + `find`               |
| Clan             | `@Clan`, `NezonUtils.getClan`               | `clan.channels.fetch` to get other channels     |
| User             | `@User`                                     | Supports `@User('username')`                    |
| Form inputs      | `@FormData`, `context.formData`             | Field ids from `addTextField`, `addSelectField` |
| Component params | `@ComponentParams`, `@ComponentPayload`     | Based on customId pattern                       |
| Attachments      | `@Attachments`, `@Attachments(0)`           | Returns `Nezon.Attachments`                     |
| Mentions         | `@Mentions`, `@Mentions(0)`                 | Support user + role mention                     |

Next: [Logic & Event Handling](logic-events.md) to learn how to use the data above in command/component/onClick.
