import type { IRunCounts } from '@/modules/Run/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';

/** A run as the picker lists it: what it walked, how it ended, its verdicts, and how long and how much. */
export interface IRunRowSummary {
  id: string;
  what: string;
  isSelected: boolean;
  ended: { icon: IconName; label: string } | null;
  counts: IRunCounts;
  facts: string;
  startedAt: string;
}
