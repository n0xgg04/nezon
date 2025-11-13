import { SetMetadata } from '@nestjs/common';

export const NEZON_EVENT_METADATA = 'nezon:event';
export const NEZON_EVENT_ONCE_METADATA = 'nezon:event:once';

export function On(event: string): MethodDecorator {
  return SetMetadata(NEZON_EVENT_METADATA, event);
}

export function Once(event: string): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    SetMetadata(NEZON_EVENT_METADATA, event)(target, propertyKey, descriptor);
    SetMetadata(NEZON_EVENT_ONCE_METADATA, true)(target, propertyKey, descriptor);
  };
}

