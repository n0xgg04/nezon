import { ClientConfigDto } from 'mezon-sdk';

export interface NezonRestrictConfig {
  clans?: string[];
  channels?: string[];
  users?: string[];
}

export interface NezonModuleOptions extends ClientConfigDto {
  restricts?: NezonRestrictConfig;
}
