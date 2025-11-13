import { NezonCommandOptions } from './command-options.interface';
import { NezonParameterMetadata } from './parameter-metadata.interface';

export interface NezonCommandDefinition {
  instance: any;
  methodName: string;
  options: NezonCommandOptions;
  parameters: NezonParameterMetadata[];
}

