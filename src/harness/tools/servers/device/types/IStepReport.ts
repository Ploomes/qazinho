import type { Severity } from '@/shared/types';

/** A step the agent judged, as it reported it through the `report` tool. */
export interface IStepReport {
  step: number;
  verdict: 'passed' | 'failed' | 'blocked';
  why: string;
  got: string;
  title: string;
  severity: Severity;
  note: string;
}
