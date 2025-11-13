# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2025-01-XX

### Added

- **ButtonBuilder với onClick handlers**: Thêm method `.onClick()` vào `ButtonBuilder` để đăng ký inline click handler. Handler tự động nhận `ButtonClickContext` với các entities đã được resolve sẵn (`message`, `channel`, `user`, `clan`, `client`).
- **ButtonClickContext**: Interface mới cung cấp context đã resolve sẵn cho onClick handlers, không cần helper function.
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

