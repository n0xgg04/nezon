import { NezonComponentOptions } from './component-options.interface';
import { NezonParameterMetadata } from './parameter-metadata.interface';

export interface NezonComponentDefinition {
  instance: any;
  methodName: string;
  options: NezonComponentOptions;
  parameters: NezonParameterMetadata[];
}

