import {
  ButtonComponent,
  EButtonMessageStyle,
  EMessageComponentType,
  IButtonMessage,
} from 'mezon-sdk/dist/cjs/interfaces/client';

export type { ButtonComponent };

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

  /**
   * Sets the custom ID for the button. This ID will be used to identify
   * the button when it's clicked and can be matched via @Component decorator.
   *
   * @param customId - The custom identifier for the button
   * @returns This builder instance for method chaining
   */
  setCustomId(customId: string): this {
    this.id = customId;
    return this;
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
   * Builds the button component according to Mezon SDK structure.
   *
   * @returns A ButtonComponent ready to be added to message components
   * @throws Error if required fields (label) are missing
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

    const component: ButtonComponent = {
      id: this.id,
      type: EMessageComponentType.BUTTON,
      component: buttonMessage,
    };

    if (this.id !== undefined) {
      component.id = this.id;
    }

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
