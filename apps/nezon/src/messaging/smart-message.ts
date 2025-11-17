import {
  ApiMessageAttachment,
  ApiMessageMention,
  ChannelMessageContent,
  EMarkdownType,
  IMessageActionRow,
  IInteractiveMessageProps,
  ReactMessagePayload,
} from 'mezon-sdk/dist/cjs/interfaces/client';
import type { ChannelMessage } from 'mezon-sdk';
import type { Clan } from 'mezon-sdk/dist/cjs/mezon-client/structures/Clan';
import type { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { User } from 'mezon-sdk/dist/cjs/mezon-client/structures/User';
import type { NezonCommandContext } from '../interfaces/command-context.interface';
import {
  ButtonBuilder,
  ButtonComponent,
  ButtonClickHandler,
} from './button-builder';
import { EmbedBuilder } from './embed-builder';

export interface NormalizedSmartMessage {
  content: ChannelMessageContent;
  attachments?: ApiMessageAttachment[];
  mentions?: ApiMessageMention[];
  mentionPlaceholders?: Record<string, string>;
}

type MentionResolver = (userId: string) => Promise<string>;

async function resolveMentionPlaceholders(
  text: string,
  placeholders: Record<string, string>,
  resolver: MentionResolver,
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
    if (!key || !placeholders[key]) {
      result += fullMatch;
      continue;
    }
    const username = await resolver(placeholders[key]);
    const cleanUsername = username || placeholders[key];
    const mentionText = `@${cleanUsername}`;
    const start = result.length;
    result += mentionText;
    mentions.push({
      user_id: placeholders[key],
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
  private mentionPlaceholders: Record<string, string> = {};

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

  addMention(key: string, userId: string): this;
  addMention(mentions: Record<string, string>): this;
  addMention(keyOrMap: string | Record<string, string>, userId?: string): this {
    if (typeof keyOrMap === 'string') {
      if (keyOrMap && typeof userId === 'string' && userId) {
        this.mentionPlaceholders[keyOrMap] = userId;
      }
      return this;
    }
    Object.entries(keyOrMap).forEach(([key, value]) => {
      if (key && typeof value === 'string' && value) {
        this.mentionPlaceholders[key] = value;
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
          ? { ...this.mentionPlaceholders }
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
      async (id) => this.fetchUsername(id),
    );
    return {
      ...payload,
      content: {
        ...payload.content,
        t: mentionResult.text,
      },
      mentions: mentionResult.mentions,
    };
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
      async (userId) => {
        const cachedValue = cache.get(userId);
        if (cachedValue) {
          return cachedValue;
        }
        const username = await this.lookupUsername(userId, clan);
        cache.set(userId, username);
        return username;
      },
    );
    return {
      ...payload,
      content: {
        ...payload.content,
        t: mentionResult.text,
      },
      mentions: mentionResult.mentions,
    };
  }

  private async lookupUsername(userId: string, clan?: Clan): Promise<string> {
    const clanUser = await this.fetchUserFromDirectory(
      clan ? (clan.users as unknown as UserDirectory) : undefined,
      userId,
    );
    if (clanUser) {
      return (
        clanUser.username ||
        clanUser.display_name ||
        (clanUser as unknown as { name?: string }).name ||
        userId
      );
    }
    const clientUsers = (
      this.context.client as unknown as {
        users?: UserDirectory;
      }
    ).users;
    const fetched = await this.fetchUserFromDirectory(clientUsers, userId);
    if (fetched) {
      return (
        fetched.username ||
        fetched.display_name ||
        (fetched as unknown as { name?: string }).name ||
        userId
      );
    }
    return userId;
  }

  private async fetchUserFromDirectory(
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
}
