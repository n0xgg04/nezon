import type { IInteractiveMessageProps } from 'mezon-sdk/dist/cjs/interfaces/client';
import { EMessageComponentType } from 'mezon-sdk';

export type { IInteractiveMessageProps as EmbedData };

interface AnimatedImageOptions {
  id?: string;
  name?: string;
  value?: string;
  imageUrl: string;
  positionUrl: string;
  pool: string[][];
  repeat?: number;
  duration?: number;
  isResult?: boolean;
  extra?: Record<string, unknown>;
}

/**
 * Builder for creating embed components compatible with Mezon SDK.
 * Follows a fluent API pattern similar to Discord.js builders.
 *
 * @example
 * ```ts
 * const embed = new EmbedBuilder()
 *   .setColor('#f0a8da')
 *   .setTitle('Title')
 *   .setDescription('Description')
 *   .addField('Field Name', 'Field Value', true)
 *   .setThumbnail('https://example.com/thumb.png')
 *   .setImage('https://example.com/image.png')
 *   .setFooter('Footer text')
 *   .build();
 * ```
 */
export class EmbedBuilder {
  private color?: string;
  private title?: string;
  private url?: string;
  private author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  private description?: string;
  private thumbnail?: {
    url: string;
  };
  private fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
    options?: any[];
    inputs?: object;
    max_options?: number;
  }> = [];
  private image?: {
    url: string;
    width?: string;
    height?: string;
  };
  private timestamp?: string;
  private footer?: {
    text: string;
    icon_url?: string;
  };

  /**
   * Sets the color of the embed border.
   *
   * @param color - Hex color code (e.g., '#f0a8da') or color name
   * @returns This builder instance for method chaining
   */
  setColor(color: string): this {
    this.color = color;
    return this;
  }

  addAnimatedImage(options: AnimatedImageOptions): this {
    const {
      id = 'animated_image',
      name = '',
      value = '',
      imageUrl,
      positionUrl,
      pool,
      repeat = 1,
      duration = 0.35,
      isResult,
      extra,
    } = options;

    const component: Record<string, unknown> = {
      url_image: imageUrl,
      url_position: positionUrl,
      pool,
      repeat,
      duration,
    };

    if (typeof isResult === 'boolean') {
      component.isResult = isResult ? 1 : 0;
    }
    if (extra) {
      Object.assign(component, extra);
    }

    this.fields.push({
      name,
      value,
      inputs: {
        id,
        type: EMessageComponentType.ANIMATION,
        component,
      },
    });
    return this;
  }

  /**
   * Sets the title of the embed.
   *
   * @param title - The embed title
   * @returns This builder instance for method chaining
   */
  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  /**
   * Sets the URL of the embed title.
   *
   * @param url - The URL to link the title to
   * @returns This builder instance for method chaining
   */
  setURL(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Sets the author of the embed.
   *
   * @param name - The author name
   * @param options - Optional author icon URL and URL
   * @returns This builder instance for method chaining
   */
  setAuthor(name: string, options?: { icon_url?: string; url?: string }): this {
    this.author = {
      name,
      icon_url: options?.icon_url,
      url: options?.url,
    };
    return this;
  }

  /**
   * Sets the description of the embed.
   *
   * @param description - The embed description
   * @returns This builder instance for method chaining
   */
  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setDescriptionMarkdown(
    description: string | string[],
    options?: {
      language?: string;
      before?: string;
      after?: string;
      wrap?: boolean;
    },
  ): this {
    const body = Array.isArray(description)
      ? description.join('\n')
      : description;
    const before = options?.before
      ? options.before.endsWith('\n')
        ? options.before
        : `${options.before}\n`
      : '';
    const after = options?.after
      ? options.after.startsWith('\n')
        ? options.after
        : `\n${options.after}`
      : '';
    if (options?.wrap === false) {
      this.description = `${before}${body}${after}`;
      return this;
    }
    const language = options?.language?.trim();
    const opener = language ? `\`\`\`${language}` : '```';
    this.description = `${before}${opener}\n${body}\n\`\`\`${after}`;
    return this;
  }

  /**
   * Sets the thumbnail of the embed.
   *
   * @param url - The thumbnail image URL
   * @returns This builder instance for method chaining
   */
  setThumbnail(url: string): this {
    this.thumbnail = { url };
    return this;
  }

  /**
   * Adds a field to the embed.
   *
   * @param name - The field name
   * @param value - The field value
   * @param inline - Whether the field should be inline (default: false)
   * @returns This builder instance for method chaining
   */
  addField(name: string, value: string, inline?: boolean): this {
    this.fields.push({
      name,
      value,
      inline,
    });
    return this;
  }

  /**
   * Adds a text input field to the embed (form field).
   *
   * @param name - The field name
   * @param inputId - The unique identifier for the input
   * @param options - Input configuration (placeholder, defaultValue, isNumber)
   * @returns This builder instance for method chaining
   *
   * @example
   * ```ts
   * embed.addTextField('Title', 'title', {
   *   placeholder: 'Input title here',
   *   defaultValue: '',
   * });
   * ```
   */
  addTextField(
    name: string,
    inputId: string,
    options?: {
      placeholder?: string;
      defaultValue?: string | number;
      isNumber?: boolean;
    },
  ): this {
    const component: any = {
      id: inputId,
    };
    if (options?.placeholder) {
      component.placeholder = options.placeholder;
    }
    if (options?.defaultValue !== undefined) {
      component.defaultValue = options.defaultValue;
    }
    if (options?.isNumber) {
      component.type = 'number';
    }

    this.fields.push({
      name,
      value: '',
      inputs: {
        id: inputId,
        type: 3,
        component,
      },
    });
    return this;
  }

  /**
   * Adds a select/dropdown field to the embed (form field).
   *
   * @param name - The field name
   * @param inputId - The unique identifier for the input
   * @param options - Array of select options with label and value
   * @param selectedValue - Optional default selected value
   * @returns This builder instance for method chaining
   *
   * @example
   * ```ts
   * embed.addSelectField('Type', 'type', [
   *   { label: 'Single choice', value: 'SINGLE' },
   *   { label: 'Multiple choice', value: 'MULTIPLE' },
   * ], 'SINGLE');
   * ```
   */
  addSelectField(
    name: string,
    inputId: string,
    options: Array<{ label: string; value: string }>,
    selectedValue?: string,
  ): this {
    const selected = selectedValue
      ? options.find((opt) => opt.value === selectedValue) || options[0]
      : options[0];

    this.fields.push({
      name,
      value: '',
      inputs: {
        id: inputId,
        type: 2,
        component: {
          id: inputId,
          options,
          valueSelected: selected,
        },
      },
    });
    return this;
  }

  /**
   * Sets the image of the embed.
   *
   * @param url - The image URL
   * @param options - Optional image width and height
   * @returns This builder instance for method chaining
   */
  setImage(url: string, options?: { width?: string; height?: string }): this {
    this.image = {
      url,
      width: options?.width,
      height: options?.height,
    };
    return this;
  }

  /**
   * Sets the timestamp of the embed.
   *
   * @param timestamp - ISO 8601 timestamp string
   * @returns This builder instance for method chaining
   */
  setTimestamp(timestamp?: string): this {
    this.timestamp = timestamp || new Date().toISOString();
    return this;
  }

  /**
   * Sets the footer of the embed.
   *
   * @param text - The footer text
   * @param icon_url - Optional footer icon URL
   * @returns This builder instance for method chaining
   */
  setFooter(text: string, icon_url?: string): this {
    this.footer = {
      text,
      icon_url,
    };
    return this;
  }

  /**
   * Builds the embed according to Mezon SDK structure.
   *
   * @returns An IInteractiveMessageProps object ready to be added to message embeds
   */
  build(): IInteractiveMessageProps {
    const embed: IInteractiveMessageProps = {};

    if (this.color !== undefined) {
      embed.color = this.color;
    }
    if (this.title !== undefined) {
      embed.title = this.title;
    }
    if (this.url !== undefined) {
      embed.url = this.url;
    }
    if (this.author !== undefined) {
      embed.author = this.author;
    }
    if (this.description !== undefined) {
      embed.description = this.description;
    }
    if (this.thumbnail !== undefined) {
      embed.thumbnail = this.thumbnail;
    }
    if (this.fields.length > 0) {
      embed.fields = this.fields;
    }
    if (this.image !== undefined) {
      embed.image = this.image;
    }
    if (this.timestamp !== undefined) {
      embed.timestamp = this.timestamp;
    }
    if (this.footer !== undefined) {
      embed.footer = this.footer;
    }

    return embed;
  }
}
