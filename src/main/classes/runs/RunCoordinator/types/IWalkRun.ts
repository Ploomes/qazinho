import type { IStartRun } from '@/types';

export interface IWalkRun extends IStartRun {
  command: string;
  shotDir: string;
  profileDir: string;
  sdkRoot: string;
  avd: string;
}
