import type { FilingRow } from './FilingRow';
import type { IBugAppearance } from './IBugAppearance';
import type { IBugShot } from './IBugShot';
import type { IFilingShot } from './IFilingShot';
import type { IRun } from '@/modules/Run/types';

/**
 * What sending a bug takes, read off its workspace: its screens, video, moment, story and
 * steps.
 */
export interface IFilingPlan {
  shots: IFilingShot[];
  videoRun: IRun | null;
  moment: IBugAppearance | null;
  story: { key: string; url: string } | null;
  screen: IBugShot | null;
  steps: FilingRow[];
}
