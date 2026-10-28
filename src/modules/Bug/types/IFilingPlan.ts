import type { FilingRow } from './FilingRow';
import type { IBugAppearance } from './IBugAppearance';
import type { IBugShot } from './IBugShot';
import type { IFilingShot } from './IFilingShot';
import type { IRun } from '@/modules/Run/types';

/**
 * O que mandar um bug leva, lido do workspace dele: as telas, o vídeo, o momento, a
 * história e os passos.
 */
export interface IFilingPlan {
  shots: IFilingShot[];
  videoRun: IRun | null;
  moment: IBugAppearance | null;
  story: { key: string; url: string } | null;
  screen: IBugShot | null;
  steps: FilingRow[];
}
