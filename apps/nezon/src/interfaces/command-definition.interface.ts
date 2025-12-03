import { NezonCommandOptions } from './command-options.interface';
import { NezonParameterMetadata } from './parameter-metadata.interface';
import type { NezonRestrictConfig } from '../nezon.module-interface';

export interface NezonCommandDefinition {
  instance: any;
  methodName: string;
  options: NezonCommandOptions;
  parameters: NezonParameterMetadata[];
  restricts?: NezonRestrictConfig;
}
