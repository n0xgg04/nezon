import { SetMetadata } from '@nestjs/common';
import { NezonCommandOptions } from '../interfaces/command-options.interface';

export const NEZON_COMMAND_METADATA = 'nezon:command';

/**
 * Registers a method as a text command handler.
 *
 * @param options Either the command name or a detailed {@link NezonCommandOptions} object.
 *
 * @example
 * ```ts
 * @Command({ name: 'ping', aliases: ['pong'], prefix: '!' })
 * async onPing(@Args() args: Nezon.Args) {
 *   // handler implementation
 * }
 * ```
 *
 * @example
 * ```ts
 * @Command('greet')
 * async greet(@Message() message?: Nezon.Message) {
 *   await message?.reply({ t: 'Hello!' });
 * }
 * ```
 */
export function Command(
  options: NezonCommandOptions | string,
): MethodDecorator {
  const payload: NezonCommandOptions =
    typeof options === 'string'
      ? { name: options }
      : options;
  return SetMetadata(NEZON_COMMAND_METADATA, payload);
}

