import {
  ButtonComponent,
  EButtonMessageStyle,
  EMessageComponentType,
  IButtonMessage,
} from 'mezon-sdk/dist/cjs/interfaces/client';
import type { ButtonClickContext } from '../interfaces/button-click-context.interface';

export type { ButtonComponent };

export type ButtonClickHandler = (
  context: ButtonClickContext,
) => Promise<void> | void;

/**
 * Builder for creating button components compatible with Mezon SDK.
 * Follows a fluent API pattern similar to Discord.js builders.
 *
 * @example
 * ```ts
 * const button = new ButtonBuilder()
 *   .setCustomId('click/12345')
 *   .setLabel('Click Me')
 *   .setStyle(ButtonStyle.Primary)
 *   .build();
 * ```
 */
export class ButtonBuilder {
  private id?: string;
  private label?: string;
  private style?: EButtonMessageStyle;
  private disabled?: boolean;
  private url?: string;
  private onClickHandler?: ButtonClickHandler;

  /**
   * Sets the custom ID for the button. This ID will be used to identify
   * the button when it's clicked and can be matched via @Component decorator.
   *
   * @param customId - The custom identifier for the button
   * @returns This builder instance for method chaining
   * @throws Error if onClick handler is already set
   */
  setCustomId(customId: string): this {
    if (this.onClickHandler) {
      throw new Error(
        'Cannot use setCustomId() when onClick() is already set. Use either setCustomId() or onClick(), not both.',
      );
    }
    this.id = customId;
    return this;
  }

  /**
   * Sets an inline click handler for the button. This will automatically
   * generate a unique custom ID and register the handler.
   * Cannot be used together with setCustomId().
   *
   * The handler receives a context object with pre-resolved entities:
   * - `message`: ManagedMessage instance with reply/update/delete methods
   * - `channel`: TextChannel instance (or undefined)
   * - `user`: User instance (or undefined)
   * - `clan`: Clan instance (or undefined)
   * - `client`: MezonClient instance
   * - `formData`: Parsed form inputs (if the button was submitted with embed form fields)
   *
   * @param handler - The handler function to execute when the button is clicked
   * @returns This builder instance for method chaining
   * @throws Error if customId is already set
   *
   * @example
   * ```ts
   * const button = new ButtonBuilder()
   *   .setLabel('Click Me')
   *   .setStyle(ButtonStyle.Primary)
   *   .onClick(async (context) => {
   *     await context.message.reply(SmartMessage.text('Button clicked!'));
   *     const channelName = context.channel?.name ?? 'unknown';
   *     const userName = context.user?.username ?? 'unknown';
   *     const input = context.formData?.['feedback'] ?? 'no input';
   *   });
   * ```
   */
  onClick(handler: ButtonClickHandler): this {
    if (this.id) {
      throw new Error(
        'Cannot use onClick() when setCustomId() is already set. Use either setCustomId() or onClick(), not both.',
      );
    }
    this.onClickHandler = handler;
    return this;
  }

  /**
   * Gets the onClick handler if set.
   *
   * @internal
   */
  getOnClickHandler(): ButtonClickHandler | undefined {
    return this.onClickHandler;
  }

  /**
   * Sets the label text displayed on the button.
   *
   * @param label - The button label text
   * @returns This builder instance for method chaining
   */
  setLabel(label: string): this {
    this.label = label;
    return this;
  }

  /**
   * Sets the visual style of the button.
   *
   * @param style - The button style (Primary, Secondary, Success, Danger, Link)
   * @returns This builder instance for method chaining
   */
  setStyle(style: EButtonMessageStyle | ButtonStyle): this {
    this.style = style as EButtonMessageStyle;
    return this;
  }

  /**
   * Sets whether the button is disabled.
   *
   * @param disabled - Whether the button should be disabled
   * @returns This builder instance for method chaining
   */
  setDisabled(disabled: boolean): this {
    this.disabled = disabled;
    return this;
  }

  /**
   * Sets the URL for link-style buttons.
   *
   * @param url - The URL to navigate to when clicked
   * @returns This builder instance for method chaining
   */
  setURL(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Generates a unique custom ID for onClick handlers.
   * Uses crypto.randomUUID() for guaranteed uniqueness across all users and instances.
   *
   * @internal
   */
  private generateOnClickId(): string {
    const prefix = 'nezon_onclick_';
    let uuid: string;
    try {
      uuid = crypto.randomUUID();
    } catch {
      const random = Math.random().toString(36).substring(2, 15);
      const timestamp = Date.now().toString(36);
      const counter = Math.floor(Math.random() * 1000000).toString(36);
      uuid = `${random}_${timestamp}_${counter}`;
    }
    return `${prefix}${uuid}`;
  }

  /**
   * Builds the button component according to Mezon SDK structure.
   * If onClick handler is set, automatically generates a unique custom ID.
   *
   * @returns A ButtonComponent ready to be added to message components
   * @throws Error if required fields (label) are missing or if neither customId nor onClick is set
   */
  build(): ButtonComponent {
    if (!this.label) {
      throw new Error('Button label is required');
    }

    const buttonMessage: IButtonMessage = {
      label: this.label,
    };

    if (this.style !== undefined) {
      buttonMessage.style = this.style;
    }

    if (this.disabled !== undefined) {
      buttonMessage.disable = this.disabled;
    }

    if (this.url !== undefined) {
      buttonMessage.url = this.url;
    }

    const customId =
      this.id ?? (this.onClickHandler ? this.generateOnClickId() : undefined);

    if (!customId && !this.url) {
      throw new Error(
        'Button must have either a custom ID (setCustomId) or an onClick handler, or be a link button (setURL)',
      );
    }

    const component: ButtonComponent = {
      id: customId ?? '',
      type: EMessageComponentType.BUTTON,
      component: buttonMessage,
    };

    return component;
  }
}

/**
 * Convenience enum for button styles matching EButtonMessageStyle.
 * Provides a cleaner API than using EButtonMessageStyle directly.
 */
export enum ButtonStyle {
  Primary = EButtonMessageStyle.PRIMARY,
  Secondary = EButtonMessageStyle.SECONDARY,
  Success = EButtonMessageStyle.SUCCESS,
  Danger = EButtonMessageStyle.DANGER,
  Link = EButtonMessageStyle.LINK,
}
