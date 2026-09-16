import type { IWalkRun } from './IWalkRun';
import type { WebDriver } from '@/main/classes/devices/WebDriver';
import type { IFlatStep } from '@/types';

export interface IWalkStep {
  run: IWalkRun;
  driver: WebDriver;
  step: IFlatStep;
  index: number;
  session: string | null;
}
