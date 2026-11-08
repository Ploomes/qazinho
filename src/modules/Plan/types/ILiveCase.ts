import type { IRunCase } from '@/modules/Run/types';
import type { PillStatus } from '@/shared/components/atoms/StatusPill/types';

/** Um caso da run em andamento: como ele está agora, e o que ela já andou nele. */
export interface ILiveCase {
  status: PillStatus;
  run: IRunCase | null;
}
