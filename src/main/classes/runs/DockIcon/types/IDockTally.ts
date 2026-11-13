import type { DockResult } from './DockResult';
import type { IDockRun } from './IDockRun';

/** O que o ícone sabe das runs: as que andam, o que já fechou e o resultado. */
export interface IDockTally {
  runs: Record<string, IDockRun>;
  failures: number;
  crashed: boolean;
  result: DockResult | null;
}
