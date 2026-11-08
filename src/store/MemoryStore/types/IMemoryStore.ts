import type { IKeepRequest } from '@/modules/Memory/types';

export interface IMemoryStore {
  waiting: IKeepRequest[];
  isKeeping: boolean;
  enqueue: (request: IKeepRequest) => void;
  take: () => IKeepRequest | null;
  finish: () => void;
}
