---
title: Logic & Event Handling
sidebar_position: 4
description: Guide to building commands, components, onClick, and listening to events with @On/@Once.
---

# Logic & Condition Handling

This document summarizes how to handle business flows in Nezon. Each item links to detailed pages for deeper exploration.

## 1. Command – Text Commands

Use `@Command()` to create commands like `*ping`, `*poll`...

```ts
import { Command, AutoContext, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Command({ name: "ping", aliases: ["pong"] })
export class PingCommand {
  async execute(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(SmartMessage.text("pong!"));
  }
}
```

- Supports `@Args()` to get parameters.
- Can be organized into multiple handler modules (see `apps/mebot`).

👉 Details: [Interaction → Command](../interaction/command.md).

## 2. Component – Handle Button/Dropdown

Use `@Component()` with a `pattern` matching `ButtonBuilder.setCustomId`. You can inject:

- `@ComponentParams()` / `@ComponentParams('id')`
- `@ComponentPayload()` – raw payload
- `@FormData()` – form data included
- `@AutoContext()` – reply/update message

```ts
@Component({ pattern: '/poll/create' })
async onPollCreate(
  @FormData() form: Nezon.FormData | undefined,
  @AutoContext('message') message: Nezon.AutoContextType.Message,
) {
  await message.reply(
    SmartMessage.text(
      `Form Data:\n${JSON.stringify(form, null, 2)}`,
    ),
  );
}
```

👉 Details: [Interaction → Component](../interaction/component.md).

## 3. Button onClick

Don't want to create a separate `@Component`? You can attach an inline handler when building the button.

```ts
new ButtonBuilder()
  .setLabel("Vote")
  .setStyle(ButtonStyle.Success)
  .onClick(async ({ message, user, formData }) => {
    await message.reply(
      SmartMessage.text(
        `User ${user?.username} chose: ${formData?.option ?? "N/A"}`
      )
    );
  });
```

Context is normalized:

- `message`: ManagedMessage
- `channel`: TextChannel
- `user`: User
- `clan`: Clan
- `client`: MezonClient
- `formData`: Record of inputs (if embed has form)

👉 Details: [Interaction → onClick](../interaction/onclick.md).

## 4. Event-Driven with @On / @Once

Nezon re-exports all `Nezon.Events` from `mezon-sdk`.  
`@On` listens continuously, `@Once` only runs the first time.

```ts
import { On, Once, AutoContext, SmartMessage } from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

export class EventHandlers {
  @On(Nezon.Events.ChannelMessage)
  async logMessage(
    @AutoContext("message") message: Nezon.AutoContextType.Message
  ) {
    await message.reply(SmartMessage.text("Bot saw your message!"));
  }

  @Once(Nezon.Events.BotReady)
  onReady() {
    console.log("Bot ready!");
  }
}
```

- Event list: [Events List](../events-list.md)
- Guide: [Interaction → Events](../interaction/events.md)

## 5. Quick Comparison

| Need                                | Suggestion                              |
| ----------------------------------- | --------------------------------------- |
| User types command `*`              | `@Command`                              |
| User clicks button/dropdown         | `@Component` or `ButtonBuilder.onClick` |
| Handle form embed                   | `@FormData` (component/onClick)         |
| Listen to system (join/leave/token) | `@On`, `@Once` with `Nezon.Events.*`    |

After handling logic, move to:

- [Message Builder](../message-template/overview.md) to build response content.
- [Sending Messages](../messaging/send-message.md) to learn how to reply, DM, send to other channels, or use raw Mezon SDK.
