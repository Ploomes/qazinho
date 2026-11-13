import type { ManualPrep } from './ManualPrep';

/** A vez do QA num caso à mão: qual caso, e como ele ficou pronto. */
export interface IManualTurn {
  caseId: string;
  prep: ManualPrep;
}
