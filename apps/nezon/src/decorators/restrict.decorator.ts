import { SetMetadata } from '@nestjs/common';
import type { NezonRestrictConfig } from '../nezon.module-interface';

export const NEZON_RESTRICT_METADATA = 'nezon:restrict';

export function Restrict(
  config: NezonRestrictConfig,
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey && descriptor) {
      SetMetadata(NEZON_RESTRICT_METADATA, config)(
        target,
        propertyKey,
        descriptor,
      );
    } else {
      SetMetadata(NEZON_RESTRICT_METADATA, config)(target);
    }
  };
}
