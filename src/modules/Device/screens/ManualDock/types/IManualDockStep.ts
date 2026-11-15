import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';

/** Um passo do caso na coluna, como o QA o marcou ou o que falta. */
export interface IManualDockStep {
  key: string;
  number: number;
  action: string;
  expected: string;
  status: PillStatus;
  isNow: boolean;
  className: string;
}
