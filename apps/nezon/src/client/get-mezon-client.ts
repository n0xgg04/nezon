import { MezonClient } from 'mezon-sdk';
import { NezonClientService } from './nezon-client.service';

let clientServiceInstance: NezonClientService | null = null;

export function setClientService(service: NezonClientService): void {
  clientServiceInstance = service;
}

export function getMezonClient(): MezonClient {
  if (!clientServiceInstance) {
    throw new Error(
      'MezonClient is not available. Make sure NezonModule is imported and initialized.',
    );
  }
  return clientServiceInstance.getClient();
}
