---
title: Message Builder Overview
sidebar_position: 1
description: Roadmap for building content with SmartMessage, Text, Attachments, Embed/Form/Button, and DM.
---

# Message Builder Overview

`Nezon.SmartMessage` helps you build all types of content to send to Mezon (text, images, files, embeds, forms, buttons...). Sub-pages in the **Message Builder** section go deep into each type, but first let's review the main capabilities:

| Topic                                    | Detail Page                                     |
| ---------------------------------------- | ----------------------------------------------- |
| Text, markdown, mention                  | [Text Message](./text-message.md)               |
| Images, files, audio, GIF                | [Attachments](./attachments.md)                 |
| Embed, Form input, Button/Dropdown       | [Embed / Form / Button](./embed-form-button.md) |
| Send DM, DMHelper, ManagedMessage.sendDM | [DM Message](./dm.md)                           |

## Mention User or Role

1. In the message content, place a placeholder `{{placeholder_name}}` where you want to mention.
2. Use `SmartMessage.addMention('placeholder_name', 'USER_ID')` to mention a user by ID or pass an object `{ user_id, username? }`.
3. To mention a role, pass `{ role_id: 'ROLE_ID' }` or `{ role_name: 'Role Name' }`. The SDK will find the corresponding role to render `@Role`.
4. `SmartMessage` automatically inserts a `mentions` array with accurate positions (`s`, `e`) and replaces the placeholder with the user or role name.

See API details: [SmartMessage → .addMention](./smart-message.md#addmention).

## Quick Example

```ts
import {
  Command,
  AutoContext,
  SmartMessage,
  ButtonBuilder,
  ButtonStyle,
} from "@n0xgg04/nezon";
import type { Nezon } from "@n0xgg04/nezon";

@Command("demo")
export class DemoCommand {
  async execute(@AutoContext() [message]: Nezon.AutoContext) {
    await message.reply(
      SmartMessage.text("Choose an action:")
        .addImage("https://picsum.photos/400/200", { filename: "banner.jpg" })
        .addEmbed(
          new Nezon.EmbedBuilder()
            .setTitle("Survey")
            .setDescription("What feature do you like most?")
            .addTextField("Feedback", "feedback", {
              placeholder: "Write your feedback here",
            })
        )
        .addButton(
          new ButtonBuilder()
            .setLabel("Submit Feedback")
            .setStyle(ButtonStyle.Success)
            .setCustomId("/feedback/submit")
        )
    );
  }
}
```

The `feedback` form will appear below the embed. When the user clicks the `/feedback/submit` button, you can read the data back using `@FormData('feedback')` in the component/onClick handler.

## Basic SmartMessage

- `SmartMessage.text()` – send regular message.
- `SmartMessage.system()` – wrap content in code block style.
- `SmartMessage.build()` – create empty message then attach embed/button/attachments.
- `SmartMessage.addGIF(url)` – add GIF (filetype `image/gif`).

Other methods:

| Method                                          | Description                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| `.addButton(builder)`                           | Add button or dropdown (when builder is select)       |
| `.addEmbed(builder)`                            | Add embed (combine with form inputs)                  |
| `.addImage(url)` / `.addFile()` / `.addVoice()` | Add attachments                                       |
| `.addMention(...)`                              | Create placeholder to mention user/role with new form |

Details: see each page in the table above.

## Suggested Flow

1. **Text & mention** – page [Text Message](./text-message.md) explains `SmartMessage.system`, markdown, `addMention`.
2. **Media** – page [Attachments](./attachments.md) describes `addImage`, `addFile`, `addVoice`, `addGIF`.
3. **Interactive embed** – page [Embed / Form / Button](./embed-form-button.md) guides `EmbedBuilder`, form input, button.
4. **DM** – page [DM Message](./dm.md) describes `DMHelper` and `ManagedMessage.sendDM`.

After building the message, see [Sending Messages](../messaging/send-message.md) to know when to use ManagedMessage, ChannelHelper, or DMHelper depending on context.
