import { SetMetadata } from '@nestjs/common';
import { NezonCommandOptions } from '../interfaces/command-options.interface';

export const NEZON_COMMAND_METADATA = 'nezon:command';

export function Command(
  options: NezonCommandOptions | string,
): MethodDecorator {
  const payload: NezonCommandOptions =
    typeof options === 'string'
      ? { name: options }
      : options;
  return SetMetadata(NEZON_COMMAND_METADATA, payload);
}

