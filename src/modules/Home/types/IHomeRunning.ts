import type { IHomePlan } from './IHomePlan';
import type { RunHow } from '@/shared/types';

/** Uma run andando, com como ela anda e até onde chegou. */
export interface IHomeRunning extends IHomePlan {
  kind: 'running';
  how: RunHow | null;
  isExplore: boolean;
  current: number;
  total: number;
}
