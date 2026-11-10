import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';

/** Um passo já julgado, ou o de agora, do caso em que a run em curso está. */
export interface ILiveRunStep {
  key: string;
  number: number;
  action: string;
  status: PillStatus;
  isNow: boolean;
  shot: string | null;
  onOpen: () => void;
}
