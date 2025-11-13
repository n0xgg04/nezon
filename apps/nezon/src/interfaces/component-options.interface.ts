import { Events } from 'mezon-sdk';

export interface NezonComponentOptions {
  id?: string;
  pattern?: RegExp | string;
  event?: Events | string;
  separator?: string | RegExp;
}

