import type { ILiveRunStep } from './ILiveRunStep';
import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';

/** Um caso da run em curso: como foi, se é o de agora, e os passos dele quando é. */
export interface ILiveRunCase {
  key: string;
  id: string;
  title: string;
  status: PillStatus;
  note: string;
  isNow: boolean;
  isWaiting: boolean;
  steps: ILiveRunStep[];
}
