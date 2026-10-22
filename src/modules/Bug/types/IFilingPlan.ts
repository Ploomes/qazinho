import type { FilingRow } from './FilingRow';
import type { IBugAppearance } from './IBugAppearance';
import type { IBugShot } from './IBugShot';
import type { IFilingShot } from './IFilingShot';
import type { IRun } from '@/modules/Run/types';

/** What sending a bug takes, read off its workspace: the screens and the run whose video go along, the moment it was last caught, the story it links to, the screen a GitHub issue gets pasted, and the steps it goes through. */
export interface IFilingPlan {
  shots: IFilingShot[];
  videoRun: IRun | null;
  moment: IBugAppearance | null;
  story: { key: string; url: string } | null;
  screen: IBugShot | null;
  steps: FilingRow[];
}
