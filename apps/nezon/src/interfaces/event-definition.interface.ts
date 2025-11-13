import { NezonParameterMetadata } from './parameter-metadata.interface';

export interface NezonEventDefinition {
  instance: any;
  methodName: string;
  event: string;
  once?: boolean;
  parameters: NezonParameterMetadata[];
}

