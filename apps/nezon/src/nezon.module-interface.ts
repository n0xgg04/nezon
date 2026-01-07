import { ClientConfigDto } from 'mezon-sdk';

export interface NezonRestrictConfig {
  clans?: string[];
  channels?: string[];
  users?: string[];
}

export interface NezonModuleOptions extends ClientConfigDto {
  restricts?: NezonRestrictConfig;
  autoRetry?: boolean;
  maxRetry?: number;
  retryDuration?: number;
  onCrash?: (error: Error) => void | Promise<void>;
}
