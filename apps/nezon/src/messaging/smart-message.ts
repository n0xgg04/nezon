import {
  ApiMessageAttachment,
  ChannelMessageContent,
  EMarkdownType,
  IMessageActionRow,
  IInteractiveMessageProps,
} from 'mezon-sdk/dist/cjs/interfaces/client';
import type { ChannelMessage } from 'mezon-sdk';
import type { Message } from 'mezon-sdk/dist/cjs/mezon-client/structures/Message';
import type { NezonCommandContext } from '../interfaces/command-context.interface';
import { ButtonBuilder, ButtonComponent, ButtonClickHandler } from './button-builder';
import { EmbedBuilder } from './embed-builder';

export interface NormalizedSmartMessage {
  content: ChannelMessageContent;
  attachments?: ApiMessageAttachment[];
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

export class DMHelper {
  constructor(
    private readonly client: import('mezon-sdk').MezonClient,
    private readonly helpers: ManagedMessageHelpers,
  ) {}

  async send(userId: string, message: SmartMessageLike) {
    const payload = this.helpers.normalize(message);
    
    const dmChannel = await (this.client as any).createDMchannel(userId);
    if (!dmChannel?.channel_id) {
      throw new Error(`Failed to create DM channel with user ${userId}`);
    }

    const channel = await (this.client as any).channels.fetch(dmChannel.channel_id);
    if (!channel) {
      throw new Error(`Failed to fetch DM channel ${dmChannel.channel_id}`);
    }

    return channel.send(
      payload.content,
      undefined,
      payload.attachments,
    );
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

  async reply(message: SmartMessageLike) {
    const payload = this.helpers.normalize(message);
    return this.context.reply(payload.content, undefined, payload.attachments);
  }

  async update(message: SmartMessageLike) {
    const entity = await this.context.getMessage();
    if (!entity) {
      return undefined;
    }
    const payload = this.helpers.normalize(message);
    if (typeof entity.update === 'function') {
      return entity.update(payload.content, undefined, payload.attachments);
    }
    return undefined;
  }

  async delete() {
    const entity = await this.context.getMessage();
    if (!entity) {
      return undefined;
    }
    if (typeof entity.delete === 'function') {
      return entity.delete();
    }
    return undefined;
  }

  async fetch(): Promise<Message | undefined> {
    return this.context.getMessage();
  }

  async sendDM(message: SmartMessageLike) {
    const senderId = this.context.message.sender_id;
    if (!senderId) {
      throw new Error('Cannot send DM: sender_id is not available');
    }
    const payload = this.helpers.normalize(message);
    
    const clientAny = this.context.client as any;
    const dmChannel = await clientAny.createDMchannel(senderId);
    if (!dmChannel?.channel_id) {
      throw new Error(`Failed to create DM channel with user ${senderId}`);
    }

    const channel = await clientAny.channels.fetch(dmChannel.channel_id);
    if (!channel) {
      throw new Error(`Failed to fetch DM channel ${dmChannel.channel_id}`);
    }

    return channel.send(
      payload.content,
      undefined,
      payload.attachments,
    );
  }
}
