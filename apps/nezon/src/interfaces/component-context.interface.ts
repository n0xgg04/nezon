import { MezonClient } from 'mezon-sdk';
import { MessageButtonClicked } from 'mezon-sdk/dist/cjs/rtapi/realtime';

export interface NezonComponentContext {
  payload: MessageButtonClicked;
  client: MezonClient;
  params: string[];
  match?: RegExpMatchArray | null;
  cache?: Map<symbol, unknown>;
}

