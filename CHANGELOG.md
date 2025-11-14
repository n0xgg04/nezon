# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-14

### Added

- **Direct Message (DM) Support**: Thêm hỗ trợ gửi Direct Message cho người dùng với 2 cách:
  - **DMHelper**: Class mới trong `AutoContext` để gửi DM đến user cụ thể bằng `user_id`:
    ```ts
    @AutoContext() [message, dm]: Nezon.AutoContext
    await dm.send(userId, SmartMessage.text('Hello!'));
    ```
  - **ManagedMessage.sendDM()**: Method mới để tự động gửi DM cho người gửi tin nhắn hiện tại:
    ```ts
    await message.sendDM(SmartMessage.text('Private response!'));
    ```
- **AutoContext với key parameter**: `@AutoContext` giờ hỗ trợ key parameter để lấy phần tử cụ thể thay vì phải destructure tuple:
  ```ts
  // Cách cũ (vẫn hoạt động - backward compatible)
  @AutoContext() [message]: Nezon.AutoContext
  @AutoContext() [message, dm]: Nezon.AutoContext
  
  // Cách mới với key (tiện lợi hơn)
  @AutoContext('message') message: Nezon.AutoContextType.Message
  @AutoContext('dm') dm: Nezon.AutoContextType.DM
  ```
  - Type safety đầy đủ với `Nezon.AutoContextType.Message` và `Nezon.AutoContextType.DM`
  - Autocomplete tự động khi gõ `@AutoContext('...')` - TypeScript sẽ gợi ý `'message'` hoặc `'dm'`
- **AutoContext enhancement**: `AutoContext` giờ trả về `[ManagedMessage, DMHelper]` thay vì chỉ `[ManagedMessage]`, cho phép truy cập DMHelper khi cần
- **DM Documentation**: Thêm trang documentation đầy đủ về DM tại `/docs/message-template/dm` với:
  - Hướng dẫn sử dụng DMHelper và sendDM()
  - Ví dụ code chi tiết
  - So sánh 2 cách sử dụng
  - Best practices và troubleshooting

### Changed

- **AutoContext type**: Cập nhật type definition từ `[ManagedMessage]` thành `[ManagedMessage, DMHelper]` để hỗ trợ DM functionality. Code cũ vẫn hoạt động bình thường do TypeScript cho phép destructure một phần của tuple.
- **@AutoContext decorator**: Thêm optional key parameter (`'message'` | `'dm'`) để lấy phần tử cụ thể. Khi không có key, trả về tuple như cũ để đảm bảo backward compatibility.

## [1.0.0] - 2025-11-14

### Added

- **ButtonBuilder với onClick handlers**: Thêm method `.onClick()` vào `ButtonBuilder` để đăng ký inline click handler. Handler tự động nhận `ButtonClickContext` với các entities đã được resolve sẵn (`message`, `channel`, `user`, `clan`, `client`). Không cần phải tạo component handler riêng, chỉ cần truyền callback function.
- **ButtonClickContext**: Interface mới cung cấp context đã resolve sẵn cho onClick handlers, bao gồm:
  - `message: ManagedMessage` - Message entity với các methods `reply()`, `update()`, `delete()`
  - `channel?: TextChannel` - Channel entity (nếu có)
  - `user?: User` - User entity (nếu có)
  - `clan?: Clan` - Clan entity (nếu có)
  - `client: MezonClient` - Mezon client instance
- **Event payload types đầy đủ**: Thêm type definitions cho tất cả Mezon SDK events trong `Nezon` namespace, đảm bảo type safety:
  - `Nezon.TokenSendPayload` - Type cho TokenSend event
  - `Nezon.AddClanUserPayload` - Type cho AddClanUser event
  - `Nezon.MessageReactionPayload` - Type cho MessageReaction event
  - `Nezon.UserChannelRemovedPayload` - Type cho UserChannelRemoved event
  - `Nezon.UserClanRemovedPayload` - Type cho UserClanRemoved event
  - `Nezon.UserChannelAddedPayload` - Type cho UserChannelAdded event
  - `Nezon.ChannelCreatedPayload` - Type cho ChannelCreated event
  - `Nezon.ChannelDeletedPayload` - Type cho ChannelDeleted event
  - `Nezon.ChannelUpdatedPayload` - Type cho ChannelUpdated event
  - `Nezon.RoleEventPayload` - Type cho RoleEvent
  - `Nezon.GiveCoffeePayload` - Type cho GiveCoffee event
  - `Nezon.RoleAssignPayload` - Type cho RoleAssign event
  - `Nezon.StreamingJoinedPayload` - Type cho StreamingJoinedEvent
  - `Nezon.StreamingLeavedPayload` - Type cho StreamingLeavedEvent
  - `Nezon.DropdownBoxSelectedPayload` - Type cho DropdownBoxSelected event
  - `Nezon.WebrtcSignalingFwdPayload` - Type cho WebrtcSignalingFwd event
  - `Nezon.VoiceStartedPayload` - Type cho VoiceStartedEvent
  - `Nezon.VoiceEndedPayload` - Type cho VoiceEndedEvent
  - `Nezon.VoiceJoinedPayload` - Type cho VoiceJoinedEvent
  - `Nezon.VoiceLeavedPayload` - Type cho VoiceLeavedEvent
  - `Nezon.NotificationsPayload` - Type cho Notifications event
  - `Nezon.QuickMenuPayload` - Type cho QuickMenu event
- **@EventPayload decorator**: Decorator mới để inject typed event payloads trong `@On` và `@Once` handlers. Thay thế việc sử dụng `any` bằng type-safe payloads:
  ```ts
  @On(Events.TokenSend)
  async onTokenSend(@EventPayload() payload: Nezon.TokenSendPayload) {
    // payload được typed đầy đủ
  }
  ```
- **Documentation đầy đủ**: Tạo trang documentation tại https://nezon-docs.vercel.app/ với:
  - Danh sách tất cả events và type definitions
  - Hướng dẫn chi tiết cho onClick handlers
  - Ví dụ code cho mọi tính năng
  - Best practices và API reference

### Changed

- **Type safety cho events**: Tất cả event handlers giờ đây có type safety đầy đủ thay vì sử dụng `any`. TypeScript sẽ tự động kiểm tra và gợi ý các properties có sẵn trong payload.
- **ButtonBuilder API**: Cải thiện validation để đảm bảo không thể dùng cả `.setCustomId()` và `.onClick()` cùng lúc, tránh confusion.

### Fixed

- **Type safety cho event payloads**: Loại bỏ hoàn toàn việc sử dụng `any` trong event handlers. Tất cả events giờ đây có type definitions rõ ràng.
- **ID generation cho onClick**: Sử dụng `crypto.randomUUID()` để đảm bảo uniqueness cho onClick button IDs, tránh collision giữa các users và instances.

## [0.0.7] - 2025-11-14

### Added

- **EmbedBuilder**: Builder mới để tạo rich embeds với các tính năng:
  - Fields, thumbnail, image, footer
  - Form inputs: text fields và select fields
  - Fluent API tương tự ButtonBuilder
- **SmartMessage enhancements**:
  - `.addButton()` - Thêm button components (tự động group thành action rows)
  - `.addImage()` - Thêm image attachments
  - `.addFile()` - Thêm file attachments
  - `.addEmbed()` - Thêm embed components
  - `SmartMessage.build()` - Tạo SmartMessage rỗng
- **Named parameters trong Component**: Hỗ trợ RESTful pattern như `/user/:user_id/:action` với decorator `@ComponentParams('param_name')` để lấy từng parameter hoặc `@ComponentParams()` để lấy tất cả.
- **Improved ID generation**: Sử dụng `crypto.randomUUID()` để đảm bảo uniqueness cho onClick button IDs, tránh collision giữa các users và instances.

### Changed

- **Component pattern matching**: Cải thiện pattern matching để hỗ trợ named parameters với regex parsing.
- **ButtonBuilder validation**: Không cho phép dùng cả `.setCustomId()` và `.onClick()` cùng lúc để tránh confusion.

### Fixed

- Đảm bảo button IDs unique giữa các users và instances bằng cách sử dụng UUID thay vì random string.

## [0.0.6] - Previous version

- Initial stable release với các tính năng cơ bản: Command decorators, Component decorators, SmartMessage builder, AutoContext injection.

