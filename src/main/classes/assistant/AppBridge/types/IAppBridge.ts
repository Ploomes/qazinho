import type { IAppToolRequest } from '@/shared/types';

/**
 * Where the bridge sends a call, false when no window can take it, and how long it waits
 * for the answer.
 */
export interface IAppBridge {
  send: (request: IAppToolRequest) => boolean;
  timeoutMs: number;
}
