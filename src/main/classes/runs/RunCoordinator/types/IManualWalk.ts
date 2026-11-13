import type { IWalkRun } from './IWalkRun';
import type { IFlatStep } from '@/shared/types';
import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';

/** A vez do QA num caso à mão: os passos que ele ainda marca, desde quando, e o fim. */
export interface IManualWalk {
  run: IWalkRun;
  driver: IDeviceDriver;
  pending: { step: IFlatStep; index: number }[];
  began: number;
  end: () => void;
}
