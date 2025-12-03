import { NezonComponentOptions } from './component-options.interface';
import { NezonParameterMetadata } from './parameter-metadata.interface';
import type { NezonRestrictConfig } from '../nezon.module-interface';

export interface NezonComponentDefinition {
  instance: any;
  methodName: string;
  options: NezonComponentOptions;
  parameters: NezonParameterMetadata[];
  restricts?: NezonRestrictConfig;
}
