import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';

/** Um passo do caso à mão como o painel o mostra: o que fazer, o esperado e como foi. */
export interface IManualStep {
  key: string;
  number: number;
  action: string;
  expected: string;
  status: PillStatus;
  isNow: boolean;
}
