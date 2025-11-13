import { SetMetadata } from '@nestjs/common';

export const NEZON_EVENT_METADATA = 'nezon:event';
export const NEZON_EVENT_ONCE_METADATA = 'nezon:event:once';

/**
 * Subscribes a method to a Mezon event. The handler is invoked every time the event fires.
 *
 * @param event Event name (e.g. `Events.ChannelMessage`, `Events.TokenSend`).
 *
 * @example
 * ```ts
 * @On(Events.ChannelMessage)
 * async onMessage(@ChannelMessagePayload() message: Nezon.ChannelMessage) {
 *   console.log('Incoming message:', message.content.t);
 * }
 * ```
 */
export function On(event: string): MethodDecorator {
  return SetMetadata(NEZON_EVENT_METADATA, event);
}

/**
 * Subscribes a method to a Mezon event but automatically removes the handler after the first call.
 *
 * @param event Event name (e.g. `'Ready'`, `Events.ChannelCreated`).
 *
 * @example
 * ```ts
 * @Once('Ready')
 * onReady() {
 *   console.log('Bot is ready!');
 * }
 * ```
 */
export function Once(event: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    SetMetadata(NEZON_EVENT_METADATA, event)(target, propertyKey, descriptor);
    SetMetadata(NEZON_EVENT_ONCE_METADATA, true)(target, propertyKey, descriptor);
  };
}

