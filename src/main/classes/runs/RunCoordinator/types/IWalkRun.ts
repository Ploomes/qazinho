import type { IStartRun } from '@/types';

export interface IWalkRun extends IStartRun {
  command: string;
  shotDir: string;
}
