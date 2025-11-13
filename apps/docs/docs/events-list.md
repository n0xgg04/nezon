---
id: events-list
title: "Danh sách Events"
sidebar_position: 4
---

Danh sách đầy đủ các events có thể lắng nghe trong Nezon, cùng với type definitions và ví dụ sử dụng.

## Tổng quan

Tất cả events được định nghĩa trong `Events` enum từ `mezon-sdk`. Bạn có thể sử dụng `@On` hoặc `@Once` decorator để lắng nghe các events này.

```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.ChannelMessage)
async onMessage(@EventPayload() payload: Nezon.ChannelMessage) {
  // Handle event
}
```

## Danh sách Events

### ChannelMessage

Lắng nghe tin nhắn mới trong channel.

**Type:** `Nezon.ChannelMessage`

**Ví dụ:**
```ts
import { On, ChannelMessagePayload, MessageContent } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.ChannelMessage)
async onMessage(
  @ChannelMessagePayload() payload: Nezon.ChannelMessage,
  @MessageContent() content: string | undefined,
) {
  console.log('New message:', content);
}
```

---

### MessageReaction

Lắng nghe khi user react vào message.

**Type:** `Nezon.MessageReactionPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.MessageReaction)
async onReaction(@EventPayload() payload: Nezon.MessageReactionPayload) {
  console.log('Reaction:', payload.emoji_id);
  console.log('Message ID:', payload.message_id);
  console.log('User ID:', payload.user_id);
}
```

---

### UserChannelRemoved

Lắng nghe khi user bị xóa khỏi channel.

**Type:** `Nezon.UserChannelRemovedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.UserChannelRemoved)
async onUserRemoved(@EventPayload() payload: Nezon.UserChannelRemovedPayload) {
  console.log('Channel ID:', payload.channel_id);
  console.log('User IDs:', payload.user_ids);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### UserClanRemoved

Lắng nghe khi user bị xóa khỏi clan.

**Type:** `Nezon.UserClanRemovedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.UserClanRemoved)
async onUserClanRemoved(@EventPayload() payload: Nezon.UserClanRemovedPayload) {
  console.log('Clan ID:', payload.clan_id);
  console.log('User IDs:', payload.user_ids);
}
```

---

### UserChannelAdded

Lắng nghe khi user được thêm vào channel.

**Type:** `Nezon.UserChannelAddedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.UserChannelAdded)
async onUserAdded(@EventPayload() payload: Nezon.UserChannelAddedPayload) {
  console.log('Channel:', payload.channel_desc);
  console.log('Users:', payload.users);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### ChannelCreated

Lắng nghe khi channel được tạo.

**Type:** `Nezon.ChannelCreatedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.ChannelCreated)
async onChannelCreated(@EventPayload() payload: Nezon.ChannelCreatedPayload) {
  console.log('New channel:', payload.channel_desc);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### ChannelDeleted

Lắng nghe khi channel bị xóa.

**Type:** `Nezon.ChannelDeletedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.ChannelDeleted)
async onChannelDeleted(@EventPayload() payload: Nezon.ChannelDeletedPayload) {
  console.log('Deleted channel ID:', payload.channel_id);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### ChannelUpdated

Lắng nghe khi channel được cập nhật.

**Type:** `Nezon.ChannelUpdatedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.ChannelUpdated)
async onChannelUpdated(@EventPayload() payload: Nezon.ChannelUpdatedPayload) {
  console.log('Updated channel:', payload.channel_desc);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### RoleEvent

Lắng nghe khi role được tạo hoặc cập nhật.

**Type:** `Nezon.RoleEventPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.RoleEvent)
async onRoleEvent(@EventPayload() payload: Nezon.RoleEventPayload) {
  console.log('Role ID:', payload.role_id);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### GiveCoffee

Lắng nghe khi user tặng coffee cho nhau.

**Type:** `Nezon.GiveCoffeePayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.GiveCoffee)
async onGiveCoffee(@EventPayload() payload: Nezon.GiveCoffeePayload) {
  console.log('From:', payload.from_user_id);
  console.log('To:', payload.to_user_id);
  console.log('Amount:', payload.amount);
}
```

---

### RoleAssign

Lắng nghe khi role được gán cho user.

**Type:** `Nezon.RoleAssignPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.RoleAssign)
async onRoleAssign(@EventPayload() payload: Nezon.RoleAssignPayload) {
  console.log('Role ID:', payload.role_id);
  console.log('Clan ID:', payload.ClanId);
  console.log('Users assigned:', payload.user_ids_assigned);
  console.log('Users removed:', payload.user_ids_removed);
}
```

---

### AddClanUser

Lắng nghe khi user được thêm vào clan.

**Type:** `Nezon.AddClanUserPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.AddClanUser)
async onAddClanUser(@EventPayload() payload: Nezon.AddClanUserPayload) {
  console.log('Clan ID:', payload.clan_id);
  console.log('User:', payload.user);
  console.log('Invitor:', payload.invitor);
}
```

---

### TokenSend

Lắng nghe khi token được gửi.

**Type:** `Nezon.TokenSendPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.TokenSend)
async onTokenSend(@EventPayload() payload: Nezon.TokenSendPayload) {
  console.log('From:', payload.sender_id);
  console.log('To:', payload.receiver_id);
  console.log('Amount:', payload.amount);
  console.log('Note:', payload.note);
}
```

---

### ClanEventCreated

Lắng nghe khi clan tạo event mới.

**Type:** `CreateEventRequest` (from mezon-sdk)

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';
import type { CreateEventRequest } from 'mezon-sdk';

@On(Events.ClanEventCreated)
async onClanEventCreated(@EventPayload() payload: CreateEventRequest) {
  console.log('Event created:', payload);
}
```

---

### MessageButtonClicked

Lắng nghe khi button được click (thường dùng với `@Component`).

**Type:** `Nezon.ComponentPayload`

**Ví dụ:**
```ts
import { On, ComponentPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.MessageButtonClicked)
async onButtonClick(@ComponentPayload() payload: Nezon.ComponentPayload) {
  console.log('Button ID:', payload.button_id);
  console.log('Message ID:', payload.message_id);
  console.log('User ID:', payload.user_id);
}
```

---

### StreamingJoinedEvent

Lắng nghe khi user join streaming room.

**Type:** `Nezon.StreamingJoinedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.StreamingJoinedEvent)
async onStreamingJoined(@EventPayload() payload: Nezon.StreamingJoinedPayload) {
  console.log('User ID:', payload.user_id);
  console.log('Streaming channel ID:', payload.streaming_channel_id);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### StreamingLeavedEvent

Lắng nghe khi user rời streaming room.

**Type:** `Nezon.StreamingLeavedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.StreamingLeavedEvent)
async onStreamingLeaved(@EventPayload() payload: Nezon.StreamingLeavedPayload) {
  console.log('User ID:', payload.streaming_user_id);
  console.log('Streaming channel ID:', payload.streaming_channel_id);
  console.log('Clan ID:', payload.clan_id);
}
```

---

### DropdownBoxSelected

Lắng nghe khi user chọn option trong dropdown.

**Type:** `Nezon.DropdownBoxSelectedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.DropdownBoxSelected)
async onDropdownSelected(@EventPayload() payload: Nezon.DropdownBoxSelectedPayload) {
  console.log('Selected value:', payload.value);
  console.log('Message ID:', payload.message_id);
  console.log('User ID:', payload.user_id);
}
```

---

### WebrtcSignalingFwd

Lắng nghe khi user accept call 1-1.

**Type:** `Nezon.WebrtcSignalingFwdPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.WebrtcSignalingFwd)
async onWebrtcSignaling(@EventPayload() payload: Nezon.WebrtcSignalingFwdPayload) {
  console.log('WebRTC signaling:', payload);
}
```

---

### VoiceStartedEvent

Lắng nghe khi voice channel bắt đầu.

**Type:** `Nezon.VoiceStartedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.VoiceStartedEvent)
async onVoiceStarted(@EventPayload() payload: Nezon.VoiceStartedPayload) {
  console.log('Voice started:', payload);
}
```

---

### VoiceEndedEvent

Lắng nghe khi voice channel kết thúc.

**Type:** `Nezon.VoiceEndedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.VoiceEndedEvent)
async onVoiceEnded(@EventPayload() payload: Nezon.VoiceEndedPayload) {
  console.log('Voice ended:', payload);
}
```

---

### VoiceJoinedEvent

Lắng nghe khi user join voice room.

**Type:** `Nezon.VoiceJoinedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.VoiceJoinedEvent)
async onVoiceJoined(@EventPayload() payload: Nezon.VoiceJoinedPayload) {
  console.log('User joined voice:', payload.user_id);
  console.log('Channel ID:', payload.channel_id);
}
```

---

### VoiceLeavedEvent

Lắng nghe khi user rời voice room.

**Type:** `Nezon.VoiceLeavedPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.VoiceLeavedEvent)
async onVoiceLeaved(@EventPayload() payload: Nezon.VoiceLeavedPayload) {
  console.log('User left voice:', payload.user_id);
  console.log('Channel ID:', payload.channel_id);
}
```

---

### Notifications

Lắng nghe notifications (thêm bạn, v.v.).

**Type:** `Nezon.NotificationsPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.Notifications)
async onNotifications(@EventPayload() payload: Nezon.NotificationsPayload) {
  console.log('Notification:', payload);
}
```

---

### QuickMenu

Lắng nghe quick menu event.

**Type:** `Nezon.QuickMenuPayload`

**Ví dụ:**
```ts
import { On, EventPayload } from '@n0xgg04/nezon';
import type { Nezon } from '@n0xgg04/nezon';
import { Events } from 'mezon-sdk';

@On(Events.QuickMenu)
async onQuickMenu(@EventPayload() payload: Nezon.QuickMenuPayload) {
  console.log('Quick menu:', payload);
}
```

---

## Type Definitions

Tất cả event payload types được định nghĩa trong `Nezon` namespace:

```ts
export namespace Nezon {
  export type ChannelMessage = ChannelMessage;
  export type MessageReactionPayload = MessageReaction;
  export type UserChannelRemovedPayload = UserChannelRemoved;
  export type UserClanRemovedPayload = UserClanRemovedEvent;
  export type UserChannelAddedPayload = UserChannelAddedEvent;
  export type ChannelCreatedPayload = ChannelCreatedEvent;
  export type ChannelDeletedPayload = ChannelDeletedEvent;
  export type ChannelUpdatedPayload = ChannelUpdatedEvent;
  export type RoleEventPayload = RoleEvent;
  export type GiveCoffeePayload = GiveCoffeeEvent;
  export type RoleAssignPayload = RoleAssignedEvent;
  export type AddClanUserPayload = AddClanUserEvent;
  export type TokenSendPayload = TokenSentEvent;
  export type StreamingJoinedPayload = StreamingJoinedEvent;
  export type StreamingLeavedPayload = StreamingLeavedEvent;
  export type DropdownBoxSelectedPayload = DropdownBoxSelected;
  export type WebrtcSignalingFwdPayload = WebrtcSignalingFwd;
  export type VoiceStartedPayload = VoiceStartedEvent;
  export type VoiceEndedPayload = VoiceEndedEvent;
  export type VoiceJoinedPayload = VoiceJoinedEvent;
  export type VoiceLeavedPayload = VoiceLeavedEvent;
  export type NotificationsPayload = Notifications;
  export type QuickMenuPayload = QuickMenuDataEvent;
}
```

## Best Practices

1. **Luôn sử dụng `@EventPayload()` với type annotation:**
   ```ts
   @On(Events.TokenSend)
   async onTokenSend(@EventPayload() payload: Nezon.TokenSendPayload) {
     // Type-safe access
   }
   ```

2. **Sử dụng `@On` cho events lặp lại, `@Once` cho initialization:**
   ```ts
   @Once('Ready')
   onReady() {
     // Setup
   }
   ```

3. **Kết hợp với các decorators khác:**
   ```ts
   @On(Events.ChannelMessage)
   async onMessage(
     @ChannelMessagePayload() payload: Nezon.ChannelMessage,
     @Channel() channel: Nezon.Channel | undefined,
     @User() user: Nezon.User | undefined,
   ) {
     // Access both payload and entities
   }
   ```

## Xem thêm

- [@On, @Once](/docs/interaction/events) - Hướng dẫn sử dụng decorators
- [Decorators](/docs/decorators) - Danh sách đầy đủ decorators
- [Examples](/docs/examples) - Ví dụ sử dụng

