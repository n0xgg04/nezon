import {
  ApiMessageAttachment,
  ApiMessageMention,
  ApiRole,
  ChannelMessageContent,
  EMarkdownType,
  IMessageActionRow,
  IInteractiveMessageProps,
  ReactMessagePayload,
} from 'mezon-sdk/dist/cjs/interfaces/client';
import type { ChannelMessage } from 'mezon-sdk';
import type { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { TextChannel } from 'mezon-sdk/dist/cjs/mezon-client/structures/TextChannel';
import type { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import type { NezonCommandContext } from '../interfaces/command-context.interface';
import {
  ButtonBuilder,
  ButtonComponent,
  ButtonClickHandler,
} from './button-builder';
import { EmbedBuilder } from './embed-builder';

type MentionInput =
  | string
  | {
      user_id?: string;
      userId?: string;
      username?: string;
      display_name?: string;
      role_id?: string;
      roleId?: string;
      role_name?: string;
      roleName?: string;
      type?: 'user' | 'role';
    };

type MentionPlaceholderUser = {
  kind: 'user';
  userId: string;
  label?: string;
};

type MentionPlaceholderRole = {
  kind: 'role';
  roleId?: string;
  roleName?: string;
};

type MentionPlaceholderValue = MentionPlaceholderUser | MentionPlaceholderRole;

interface MentionResolvers {
  resolveUser: (userId: string) => Promise<string>;
  resolveRole?: (
    target: MentionPlaceholderRole,
  ) => Promise<{ name: string; roleId?: string } | undefined>;
}

export interface NormalizedSmartMessage {
  content: ChannelMessageContent;
  attachments?: ApiMessageAttachment[];
  mentions?: ApiMessageMention[];
  mentionPlaceholders?: Record<string, MentionPlaceholderValue>;
}

const CLAN_ROLE_CACHE_TTL = 5 * 60 * 1000;

const clanRoleCache = new WeakMap<
  Clan,
  {
    roles: ApiRole[];
    expiresAt: number;
  }
>();

function normalizeMentionInput(
  value?: MentionInput,
): MentionPlaceholderValue | undefined {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? { kind: 'user', userId: trimmed } : undefined;
  }
  const userId = value.user_id ?? value.userId;
  const userLabel = cleanUserLabel(value.username ?? value.display_name);
  const roleId = value.role_id ?? value.roleId;
  const roleName = cleanRoleLabel(value.role_name ?? value.roleName);
  const explicitType = value.type;

  if (explicitType === 'role' || roleId || roleName) {
    if (roleId || roleName) {
      return {
        kind: 'role',
        roleId: roleId?.trim(),
        roleName,
      };
    }
    return undefined;
  }
  if (explicitType === 'user' || userId) {
    return userId
      ? {
          kind: 'user',
          userId: userId.trim(),
          label: userLabel,
        }
      : undefined;
  }
  return undefined;
}

async function getClanRoles(clan: Clan): Promise<ApiRole[]> {
  const cached = clanRoleCache.get(clan);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.roles;
  }
  try {
    const response = await clan.listRoles();
    const roles = response?.roles?.roles ?? [];
    clanRoleCache.set(clan, {
      roles,
      expiresAt: Date.now() + CLAN_ROLE_CACHE_TTL,
    });
    return roles;
  } catch {
    if (cached) {
      return cached.roles;
    }
    return [];
  }
}

function cloneMentionPlaceholderValue(
  value: MentionPlaceholderValue,
): MentionPlaceholderValue {
  if (value.kind === 'user') {
    return {
      kind: 'user',
      userId: value.userId,
      label: value.label,
    };
  }
  return {
    kind: 'role',
    roleId: value.roleId,
    roleName: value.roleName,
  };
}

function cloneMentionPlaceholdersRecord(
  placeholders: Record<string, MentionPlaceholderValue>,
): Record<string, MentionPlaceholderValue> {
  const cloned: Record<string, MentionPlaceholderValue> = {};
  for (const [key, entry] of Object.entries(placeholders)) {
    cloned[key] = cloneMentionPlaceholderValue(entry);
  }
  return cloned;
}

export function cloneMentionPlaceholders(
  placeholders?: Record<string, MentionPlaceholderValue>,
): Record<string, MentionPlaceholderValue> | undefined {
  if (!placeholders) {
    return undefined;
  }
  return cloneMentionPlaceholdersRecord(placeholders);
}

function cleanRoleLabel(label?: string | null): string | undefined {
  if (!label) {
    return undefined;
  }
  const trimmed = label.trim().replace(/^@+/, '').trim();
  return trimmed.length ? trimmed : undefined;
}

function cleanUserLabel(label?: string | null): string | undefined {
  if (!label) {
    return undefined;
  }
  const trimmed = label.trim().replace(/^@+/, '').trim();
  return trimmed.length ? trimmed : undefined;
}

async function resolveMentionPlaceholders(
  text: string,
  placeholders: Record<string, MentionPlaceholderValue>,
  resolvers: MentionResolvers,
): Promise<{ text: string; mentions: ApiMessageMention[] }> {
  if (!text) {
    return { text, mentions: [] };
  }
  const regex = /{{\s*([a-zA-Z0-9_.:-]+)\s*}}/g;
  let cursor = 0;
  let result = '';
  const mentions: ApiMessageMention[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, keyRaw] = match;
    const key = keyRaw?.trim();
    result += text.slice(cursor, match.index);
    cursor = match.index + fullMatch.length;
    if (!key) {
      result += fullMatch;
      continue;
    }
    const placeholder = placeholders[key];
    if (!placeholder) {
      result += fullMatch;
      continue;
    }
    if (placeholder.kind === 'role') {
      const resolved = resolvers.resolveRole
        ? await resolvers.resolveRole(placeholder)
        : undefined;
      const roleLabel =
        cleanRoleLabel(resolved?.name) ??
        placeholder.roleName ??
        placeholder.roleId ??
        'role';
      if (!roleLabel) {
        result += fullMatch;
        continue;
      }
      const mentionText = `@${roleLabel}`;
      const start = result.length;
      result += mentionText;
      const roleId = resolved?.roleId ?? placeholder.roleId;
      if (roleId) {
        mentions.push({
          role_id: roleId,
          rolename: mentionText,
          s: start,
          e: start + mentionText.length,
        });
      }
      continue;
    }
    const username = await resolvers.resolveUser(placeholder.userId);
    const cleanUsername =
      cleanUserLabel(username) ?? placeholder.label ?? placeholder.userId;
    const mentionText = `@${cleanUsername}`;
    const start = result.length;
    result += mentionText;
    mentions.push({
      user_id: placeholder.userId,
      username: cleanUsername,
      s: start,
      e: start + mentionText.length,
    });
  }

  result += text.slice(cursor);
  return { text: result, mentions };
}

export type SmartMessageLike =
  | SmartMessage
  | NormalizedSmartMessage
  | ChannelMessageContent
  | string;

/**
 * Global registry for button onClick handlers.
 * This is a singleton that can be accessed without DI.
 */
class ButtonClickRegistry {
  private handlers: Map<string, ButtonClickHandler> = new Map();

  register(customId: string, handler: ButtonClickHandler): void {
    this.handlers.set(customId, handler);
  }

  getHandler(customId: string): ButtonClickHandler | undefined {
    return this.handlers.get(customId);
  }

  hasHandler(customId: string): boolean {
    return this.handlers.has(customId);
  }

  unregister(customId: string): void {
    this.handlers.delete(customId);
  }

  clear(): void {
    this.handlers.clear();
  }
}

const buttonClickRegistry = new ButtonClickRegistry();

/**
 * Gets the global button click registry.
 * Used internally by component service to handle onClick handlers.
 *
 * @internal
 */
export function getButtonClickRegistry(): ButtonClickRegistry {
  return buttonClickRegistry;
}

/**
 * Fluent builder for channel message payloads bundled with optional attachments, components, and embeds.
 */
export class SmartMessage {
  private components: ButtonComponent[] = [];
  private attachments: ApiMessageAttachment[] = [];
  private embeds: IInteractiveMessageProps[] = [];
  private mentionPlaceholders: Record<string, MentionPlaceholderValue> = {};

  private constructor(
    private readonly content: ChannelMessageContent,
    attachments?: ApiMessageAttachment[],
  ) {
    if (attachments) {
      this.attachments = [...attachments];
    }
  }

  static text(content: string): SmartMessage {
    return new SmartMessage({ t: content });
  }

  static build(): SmartMessage {
    return new SmartMessage({});
  }

  static system(content: string): SmartMessage {
    return new SmartMessage({
      t: content,
      mk: [
        {
          type: EMarkdownType.PRE,
          s: 0,
          e: content.length,
        },
      ],
    });
  }

  static voice(url: string, options?: { transcript?: string }): SmartMessage {
    return new SmartMessage(
      options?.transcript ? { t: options.transcript } : {},
      [
        {
          url,
          filetype: 'audio',
        },
      ],
    );
  }

  static image(
    url: string,
    options?: {
      alt?: string;
      filename?: string;
      width?: number;
      height?: number;
    },
  ): SmartMessage {
    const attachment: ApiMessageAttachment = {
      url,
      filetype: 'image',
      filename: options?.filename,
      width: options?.width,
      height: options?.height,
    };
    return new SmartMessage(options?.alt ? { t: options.alt } : {}, [
      attachment,
    ]);
  }

  static raw(
    content: ChannelMessageContent,
    attachments?: ApiMessageAttachment[],
  ): SmartMessage {
    return new SmartMessage(content, attachments);
  }

  /**
   * Adds a button component to the message.
   * Buttons are automatically grouped into action rows (max 5 buttons per row).
   * If the button has an onClick handler, it will be automatically registered.
   *
   * @param button - A ButtonBuilder instance or a built ButtonComponent
   * @returns This SmartMessage instance for method chaining
   *
   * @example
   * ```ts
   * const msg = SmartMessage.text('Click the button!')
   *   .addButton(
   *     new ButtonBuilder()
   *       .setCustomId('click/12345')
   *       .setLabel('Click Me')
   *       .setStyle(ButtonStyle.Primary)
   *   );
   * ```
   *
   * @example With onClick handler
   * ```ts
   * const msg = SmartMessage.text('Click the button!')
   *   .addButton(
   *     new ButtonBuilder()
   *       .setLabel('Click Me')
   *       .setStyle(ButtonStyle.Primary)
   *       .onClick(async (context) => {
   *         // Handler will be automatically registered
   *       })
   *   );
   * ```
   */
  addButton(button: ButtonBuilder | ButtonComponent): this {
    if (button instanceof ButtonBuilder) {
      const handler = button.getOnClickHandler();
      const built = button.build();
      this.components.push(built);
      if (handler && built.id) {
        buttonClickRegistry.register(built.id, handler);
      }
    } else {
      this.components.push(button);
    }
    return this;
  }

  /**
   * Adds an image attachment to the message.
   *
   * @param url - The URL of the image
   * @param options - Optional image configuration (filename, dimensions)
   * @returns This SmartMessage instance for method chaining
   *
   * @example
   * ```ts
   * const msg = SmartMessage.text('Check out this image!')
   *   .addImage('https://example.com/image.png', {
   *     filename: 'example.png',
   *     width: 800,
   *     height: 600,
   *   });
   * ```
   */
  addImage(
    url: string,
    options?: {
      filename?: string;
      width?: number;
      height?: number;
    },
  ): this {
    const attachment: ApiMessageAttachment = {
      url,
      filetype: 'image',
      filename: options?.filename,
      width: options?.width,
      height: options?.height,
    };
    this.attachments.push(attachment);
    return this;
  }

  /**
   * Adds a file attachment to the message.
   *
   * @param url - The URL of the file
   * @param filename - The filename of the file
   * @param filetype - The MIME type of the file (e.g., 'application/x-zip-compressed', 'application/pdf')
   * @param options - Optional file configuration (size)
   * @returns This SmartMessage instance for method chaining
   *
   * @example
   * ```ts
   * const msg = SmartMessage.text('Here is a file!')
   *   .addFile(
   *     'https://example.com/file.zip',
   *     'file.zip',
   *     'application/x-zip-compressed',
   *     { size: 3215230 }
   *   );
   * ```
   */
  addFile(
    url: string,
    filename: string,
    filetype: string,
    options?: {
      size?: number;
    },
  ): this {
    const attachment: ApiMessageAttachment = {
      url,
      filename,
      filetype,
      size: options?.size,
    };
    this.attachments.push(attachment);
    return this;
  }

  addGIF(
    url: string,
    options?: {
      filename?: string;
      width?: number;
      height?: number;
      size?: number;
    },
  ): this {
    const attachment: ApiMessageAttachment = {
      url,
      filetype: 'image/gif',
      filename: options?.filename,
      width: options?.width,
      height: options?.height,
      size: options?.size,
    };
    this.attachments.push(attachment);
    return this;
  }

  /**
   * Adds an embed to the message.
   *
   * @param embed - An EmbedBuilder instance or a built IInteractiveMessageProps object
   * @returns This SmartMessage instance for method chaining
   *
   * @example
   * ```ts
   * const msg = SmartMessage.text('Check out this embed!')
   *   .addEmbed(
   *     new EmbedBuilder()
   *       .setColor('#f0a8da')
   *       .setTitle('Title')
   *       .setDescription('Description')
   *       .addField('Field Name', 'Field Value', true)
   *       .setThumbnail('https://example.com/thumb.png')
   *       .setImage('https://example.com/image.png')
   *       .setFooter('Footer text')
   *   );
   * ```
   */
  addEmbed(embed: EmbedBuilder | IInteractiveMessageProps): this {
    if (embed instanceof EmbedBuilder) {
      this.embeds.push(embed.build());
    } else {
      this.embeds.push(embed);
    }
    return this;
  }

  addMention(key: string, value: MentionInput): this;
  addMention(mentions: Record<string, MentionInput>): this;
  addMention(
    keyOrMap: string | Record<string, MentionInput>,
    value?: MentionInput,
  ): this {
    if (typeof keyOrMap === 'string') {
      const normalized = normalizeMentionInput(value);
      if (keyOrMap && normalized) {
        this.mentionPlaceholders[keyOrMap] = normalized;
      }
      return this;
    }
    Object.entries(keyOrMap).forEach(([key, target]) => {
      const normalized = normalizeMentionInput(target);
      if (key && normalized) {
        this.mentionPlaceholders[key] = normalized;
      }
    });
    return this;
  }

  toJSON(): NormalizedSmartMessage {
    const contentWithComponents: ChannelMessageContent = { ...this.content };
    if (this.components.length > 0) {
      const actionRows: IMessageActionRow[] = [];
      for (let i = 0; i < this.components.length; i += 5) {
        actionRows.push({
          components: this.components.slice(i, i + 5),
        });
      }
      contentWithComponents.components = actionRows;
    }
    if (this.embeds.length > 0) {
      contentWithComponents.embed = this.embeds.map((embed) => ({ ...embed }));
    }
    return {
      content: contentWithComponents,
      attachments:
        this.attachments.length > 0
          ? this.attachments.map((attachment) => ({ ...attachment }))
          : undefined,
      mentionPlaceholders:
        Object.keys(this.mentionPlaceholders).length > 0
          ? cloneMentionPlaceholdersRecord(this.mentionPlaceholders)
          : undefined,
    };
  }

  toContent(): ChannelMessageContent {
    const content: ChannelMessageContent = { ...this.content };
    if (this.components.length > 0) {
      const actionRows: IMessageActionRow[] = [];
      for (let i = 0; i < this.components.length; i += 5) {
        actionRows.push({
          components: this.components.slice(i, i + 5),
        });
      }
      content.components = actionRows;
    }
    if (this.embeds.length > 0) {
      content.embed = this.embeds.map((embed) => ({ ...embed }));
    }
    return content;
  }

  toAttachments(): ApiMessageAttachment[] | undefined {
    return this.attachments.length > 0
      ? this.attachments.map((attachment) => ({ ...attachment }))
      : undefined;
  }
}

interface ManagedMessageHelpers {
  normalize: (input: SmartMessageLike) => NormalizedSmartMessage;
}

type UserDirectory = {
  get?: (id: string) => User | undefined;
  fetch?: (id: string) => Promise<User | undefined>;
};

export class DMHelper {
  constructor(
    private readonly client: import('mezon-sdk').MezonClient,
    private readonly helpers: ManagedMessageHelpers,
  ) {}

  async send(userId: string, message: SmartMessageLike) {
    const payload = await this.preparePayload(message);

    const dmChannel = await (this.client as any).createDMchannel(userId);
    if (!dmChannel?.channel_id) {
      throw new Error(`Failed to create DM channel with user ${userId}`);
    }

    const channel = await (this.client as any).channels.fetch(
      dmChannel.channel_id,
    );
    if (!channel) {
      throw new Error(`Failed to fetch DM channel ${dmChannel.channel_id}`);
    }

    return channel.send(payload.content, payload.mentions, payload.attachments);
  }

  private async preparePayload(
    message: SmartMessageLike,
  ): Promise<NormalizedSmartMessage> {
    const payload = this.helpers.normalize(message);
    return this.applyMentionPlaceholders(payload, {
      resolveUser: (id) => this.fetchUsername(id),
    });
  }

  private async fetchUsername(userId: string): Promise<string> {
    try {
      const users = (this.client as any)?.users;
      const cached = users?.get?.(userId);
      if (cached?.username) {
        return cached.username;
      }
      if (users?.fetch) {
        const fetched = await users.fetch(userId);
        if (fetched?.username) {
          return fetched.username;
        }
      }
    } catch {
      return userId;
    }
    return userId;
  }

  private async applyMentionPlaceholders(
    payload: NormalizedSmartMessage,
    resolvers: MentionResolvers,
  ): Promise<NormalizedSmartMessage> {
    if (
      !payload.mentionPlaceholders ||
      Object.keys(payload.mentionPlaceholders).length === 0 ||
      typeof payload.content?.t !== 'string'
    ) {
      return payload;
    }
    const mentionResult = await resolveMentionPlaceholders(
      payload.content.t,
      payload.mentionPlaceholders,
      resolvers,
    );
    return {
      ...payload,
      content: {
        ...payload.content,
        t: mentionResult.text,
      },
      mentions: [...(payload.mentions ?? []), ...mentionResult.mentions],
    };
  }
}

export class ChannelHelper {
  constructor(
    private readonly context: NezonCommandContext,
    private readonly helpers: ManagedMessageHelpers,
    private readonly targetChannelId?: string,
  ) {}

  async send(message: SmartMessageLike) {
    const channel = await this.resolveChannel();
    if (!channel) {
      throw new Error('Cannot send message: channel could not be resolved');
    }
    const payload = await this.preparePayload(message, channel);
    return channel.send(payload.content, payload.mentions, payload.attachments);
  }

  find(channelId: string): ChannelHelper {
    if (!channelId) {
      throw new Error('channelId is required to bind channel helper');
    }
    return new ChannelHelper(this.context, this.helpers, channelId);
  }

  private async resolveChannel(): Promise<TextChannel | undefined> {
    const channelId = this.targetChannelId ?? this.context.message.channel_id;
    if (!channelId) {
      return undefined;
    }
    if (!this.targetChannelId) {
      try {
        const cached = await this.context.getChannel();
        if (cached) {
          return cached;
        }
      } catch {
        // fallback to fetch
      }
    }
    try {
      const fetched = await this.context.client.channels.fetch(channelId);
      return fetched as TextChannel;
    } catch {
      return undefined;
    }
  }

  private async preparePayload(
    message: SmartMessageLike,
    channel?: TextChannel,
  ): Promise<NormalizedSmartMessage> {
    const payload = this.helpers.normalize(message);
    return this.applyMentionPlaceholders(payload, channel);
  }

  private async applyMentionPlaceholders(
    payload: NormalizedSmartMessage,
    channel?: TextChannel,
  ): Promise<NormalizedSmartMessage> {
    if (
      !payload.mentionPlaceholders ||
      Object.keys(payload.mentionPlaceholders).length === 0 ||
      typeof payload.content?.t !== 'string'
    ) {
      return payload;
    }
    const clan =
      channel?.clan ??
      (typeof this.context.getClan === 'function'
        ? await this.context.getClan()
        : undefined);
    const cache = new Map<string, string>();
    const mentionResult = await resolveMentionPlaceholders(
      payload.content.t,
      payload.mentionPlaceholders,
      {
        resolveUser: async (userId) => {
          const cachedValue = cache.get(userId);
          if (cachedValue) {
            return cachedValue;
          }
          const username = await lookupUsernameUsingContext(
            this.context,
            userId,
            clan,
          );
          cache.set(userId, username);
          return username;
        },
        resolveRole: (target) => lookupRoleInClan(target, clan),
      },
    );
    return {
      ...payload,
      content: {
        ...payload.content,
        t: mentionResult.text,
      },
      mentions: [...(payload.mentions ?? []), ...mentionResult.mentions],
    };
  }
}

/**
 * Wrapper around the current message entity providing convenience helpers
 * for replying or updating messages using {@link SmartMessage}.
 */
export class ManagedMessage {
  constructor(
    private readonly context: NezonCommandContext,
    private readonly helpers: ManagedMessageHelpers,
  ) {}

  get raw(): ChannelMessage {
    return this.context.message;
  }

  get id(): string | undefined {
    return this.context.message.message_id;
  }

  get channelId(): string | undefined {
    return this.context.message.channel_id;
  }

  get senderId(): string | undefined {
    return this.context.message.sender_id;
  }

  get isBotMessage(): boolean {
    try {
      const clientAny = this.context.client as any;
      const clientId =
        clientAny.user?.id || clientAny.getClientId?.() || clientAny.botId;
      return this.context.message.sender_id === clientId;
    } catch {
      return false;
    }
  }

  async reply(message: SmartMessageLike) {
    const payload = await this.preparePayload(message);
    return this.context.reply(
      payload.content,
      payload.mentions,
      payload.attachments,
    );
  }

  async update(message: SmartMessageLike) {
    const entity = await this.context.getMessage();
    if (!entity) {
      throw new Error('Cannot update message: message entity not found');
    }
    const payload = await this.preparePayload(message);
    if (typeof entity.update === 'function') {
      return entity.update(
        payload.content,
        payload.mentions,
        payload.attachments,
      );
    }
    throw new Error('Cannot update message: update method not available');
  }

  async delete() {
    const entity = await this.context.getMessage();
    if (!entity) {
      throw new Error('Cannot delete message: message entity not found');
    }
    if (typeof entity.delete === 'function') {
      return entity.delete();
    }
    throw new Error('Cannot delete message: delete method not available');
  }

  async react(emoji: string, emojiId?: string, actionDelete = false) {
    const entity = await this.context.getMessage();
    if (!entity) {
      throw new Error('Cannot react to message: message entity not found');
    }
    if (typeof entity.react !== 'function') {
      throw new Error('Cannot react to message: react method not available');
    }
    const reactData: ReactMessagePayload = {
      emoji_id: emojiId || emoji,
      emoji: emoji,
      count: 1,
      action_delete: actionDelete,
    };
    return entity.react(reactData);
  }

  async addReaction(emoji: string, emojiId?: string) {
    return this.react(emoji, emojiId, false);
  }

  async removeReaction(emoji: string, emojiId?: string) {
    return this.react(emoji, emojiId, true);
  }

  async fetch(): Promise<Message | undefined> {
    return this.context.getMessage();
  }

  async sendDM(message: SmartMessageLike) {
    const senderId = this.context.message.sender_id;
    if (!senderId) {
      throw new Error('Cannot send DM: sender_id is not available');
    }
    const payload = await this.preparePayload(message);

    const clientAny = this.context.client as any;
    const dmChannel = await clientAny.createDMchannel(senderId);
    if (!dmChannel?.channel_id) {
      throw new Error(`Failed to create DM channel with user ${senderId}`);
    }

    const channel = await clientAny.channels.fetch(dmChannel.channel_id);
    if (!channel) {
      throw new Error(`Failed to fetch DM channel ${dmChannel.channel_id}`);
    }

    return channel.send(payload.content, payload.mentions, payload.attachments);
  }

  private async preparePayload(
    message: SmartMessageLike,
  ): Promise<NormalizedSmartMessage> {
    const payload = this.helpers.normalize(message);
    return this.applyMentionPlaceholders(payload);
  }

  private async applyMentionPlaceholders(
    payload: NormalizedSmartMessage,
  ): Promise<NormalizedSmartMessage> {
    if (
      !payload.mentionPlaceholders ||
      Object.keys(payload.mentionPlaceholders).length === 0 ||
      typeof payload.content?.t !== 'string'
    ) {
      return payload;
    }
    const clan =
      typeof this.context.getClan === 'function'
        ? await this.context.getClan()
        : undefined;
    const cache = new Map<string, string>();
    const mentionResult = await resolveMentionPlaceholders(
      payload.content.t,
      payload.mentionPlaceholders,
      {
        resolveUser: async (userId) => {
          const cachedValue = cache.get(userId);
          if (cachedValue) {
            return cachedValue;
          }
          const username = await lookupUsernameUsingContext(
            this.context,
            userId,
            clan,
          );
          cache.set(userId, username);
          return username;
        },
        resolveRole: (target) => lookupRoleInClan(target, clan),
      },
    );
    return {
      ...payload,
      content: {
        ...payload.content,
        t: mentionResult.text,
      },
      mentions: [...(payload.mentions ?? []), ...mentionResult.mentions],
    };
  }
}

async function lookupUsernameUsingContext(
  context: NezonCommandContext,
  userId: string,
  clan?: any,
): Promise<string> {
  const clanUser = await fetchUserFromDirectory(
    clan ? (clan.users as unknown as UserDirectory) : undefined,
    userId,
  );
  if (clanUser) {
    return (
      clanUser.username ||
      (clanUser as unknown as { display_name?: string }).display_name ||
      (clanUser as unknown as { name?: string }).name ||
      userId
    );
  }
  const clientUsers = (
    context.client as unknown as {
      users?: UserDirectory;
    }
  ).users;
  const fetched = await fetchUserFromDirectory(clientUsers, userId);
  if (fetched) {
    return (
      fetched.username ||
      (fetched as unknown as { display_name?: string }).display_name ||
      (fetched as unknown as { name?: string }).name ||
      userId
    );
  }
  return userId;
}

async function lookupRoleInClan(
  target: MentionPlaceholderRole,
  clan?: Clan,
): Promise<{ name: string; roleId?: string } | undefined> {
  const fallback = (): { name: string; roleId?: string } | undefined => {
    const fallbackName =
      cleanRoleLabel(target.roleName) ??
      cleanRoleLabel(target.roleId) ??
      undefined;
    if (!fallbackName && !target.roleId) {
      return undefined;
    }
    return {
      name: fallbackName ?? 'role',
      roleId: target.roleId,
    };
  };
  if (!clan) {
    return fallback();
  }
  try {
    const roles = await getClanRoles(clan);
    const normalizedTargetName = target.roleName
      ? cleanRoleLabel(target.roleName)?.toLowerCase()
      : undefined;
    const role =
      roles.find((item) => item.id && item.id === target.roleId) ||
      (normalizedTargetName
        ? roles.find((item) => {
            const title = cleanRoleLabel(
              item.title ?? item.slug ?? item.role_icon ?? '',
            );
            return title?.toLowerCase() === normalizedTargetName;
          })
        : undefined);
    if (role) {
      return {
        name:
          cleanRoleLabel(
            role.title ||
              role.slug ||
              role.role_icon ||
              target.roleName ||
              role.id ||
              'role',
          ) ?? 'role',
        roleId: role.id ?? target.roleId,
      };
    }
  } catch {
    // ignore errors, fallback below
  }
  return fallback();
}

async function fetchUserFromDirectory(
  directory: UserDirectory | undefined,
  userId: string,
): Promise<User | undefined> {
  if (!directory) {
    return undefined;
  }
  const existing = directory.get?.(userId);
  if (existing) {
    return existing;
  }
  if (directory.fetch) {
    try {
      return await directory.fetch(userId);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
