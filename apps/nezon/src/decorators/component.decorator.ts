import { SetMetadata } from '@nestjs/common';
import { NezonComponentOptions } from '../interfaces/component-options.interface';

export const NEZON_COMPONENT_METADATA = 'nezon:component';

/**
 * Registers a method as a handler for interactive components (e.g. buttons).
 *
 * @param options Either the component id as a string or a detailed {@link NezonComponentOptions} object.
 *
 * @example Handle an exact component id
 * ```ts
 * @Component({ id: 'confirm_button' })
 * async onConfirm(@ComponentPayload() payload: Nezon.ComponentPayload) {
 *   // handle click
 * }
 * ```
 *
 * @example Match component ids via RegExp
 * ```ts
 * @Component({ pattern: '^poll_vote_.+' })
 * async onVote(@ComponentParams() params: Nezon.ComponentParams) {
 *   const pollId = params.at(-1);
 * }
 * ```
 */
export function Component(
  options: NezonComponentOptions | string,
): MethodDecorator {
  const payload: NezonComponentOptions =
    typeof options === 'string'
      ? { id: options }
      : options;
  return SetMetadata(NEZON_COMPONENT_METADATA, payload);
}

