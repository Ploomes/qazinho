import type { IWalkRun } from './IWalkRun';
import type { IDeviceDriver } from '@/main/classes/devices/types';
import type { IFlatStep } from '@/types';

export interface IWalkStep {
  run: IWalkRun;
  driver: IDeviceDriver;
  step: IFlatStep;
  index: number;
  session: string | null;
}
