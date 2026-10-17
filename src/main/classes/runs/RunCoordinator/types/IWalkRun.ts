import type { IStartRun } from '@/shared/types';

export interface IWalkRun extends IStartRun {
  command: string;
  shotDir: string;
  profileDir: string;
  sdkRoot: string;
  avd: string;
  idb: string;
  udid: string;
}
