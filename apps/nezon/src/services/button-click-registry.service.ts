import { Injectable } from '@nestjs/common';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';
import type { NezonComponentContext } from '../interfaces/component-context.interface';

export type ButtonClickHandler = (
  context: NezonComponentContext,
) => Promise<void> | void;

@Injectable()
export class ButtonClickRegistryService {
  private handlers: Map<string, ButtonClickHandler> = new Map();

  /**
   * Registers a click handler for a button with the given custom ID.
   *
   * @param customId - The custom ID of the button
   * @param handler - The handler function to execute when the button is clicked
   */
  register(customId: string, handler: ButtonClickHandler): void {
    this.handlers.set(customId, handler);
  }

  /**
   * Unregisters a click handler for a button.
   *
   * @param customId - The custom ID of the button
   */
  unregister(customId: string): void {
    this.handlers.delete(customId);
  }

  /**
   * Gets the handler for a button click event.
   *
   * @param customId - The custom ID of the button
   * @returns The handler function if found, undefined otherwise
   */
  getHandler(customId: string): ButtonClickHandler | undefined {
    return this.handlers.get(customId);
  }

  /**
   * Checks if a handler exists for the given custom ID.
   *
   * @param customId - The custom ID of the button
   * @returns True if a handler exists, false otherwise
   */
  hasHandler(customId: string): boolean {
    return this.handlers.has(customId);
  }

  /**
   * Executes the handler for a button click if one exists.
   *
   * @param customId - The custom ID of the button
   * @param context - The component context
   */
  async execute(customId: string, context: NezonComponentContext): Promise<void> {
    const handler = this.handlers.get(customId);
    if (handler) {
      await handler(context);
    }
  }

  /**
   * Clears all registered handlers.
   */
  clear(): void {
    this.handlers.clear();
  }
}

