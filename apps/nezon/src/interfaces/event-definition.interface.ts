import { NezonParameterMetadata } from './parameter-metadata.interface';
import type { NezonRestrictConfig } from '../nezon.module-interface';

export interface NezonEventDefinition {
  instance: any;
  methodName: string;
  event: string;
  once?: boolean;
  parameters: NezonParameterMetadata[];
  restricts?: NezonRestrictConfig;
}
