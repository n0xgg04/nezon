import { SetMetadata } from '@nestjs/common';
import { NezonComponentOptions } from '../interfaces/component-options.interface';

export const NEZON_COMPONENT_METADATA = 'nezon:component';

export function Component(
  options: NezonComponentOptions | string,
): MethodDecorator {
  const payload: NezonComponentOptions =
    typeof options === 'string'
      ? { id: options }
      : options;
  return SetMetadata(NEZON_COMPONENT_METADATA, payload);
}

