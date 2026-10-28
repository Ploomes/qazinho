import type { IRunCounts } from '@/modules/Run/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';

/**
 * Uma run como o seletor a lista: o que andou, como terminou, os vereditos, e quanto
 * tempo e quanto custou.
 */
export interface IRunRowSummary {
  id: string;
  what: string;
  isSelected: boolean;
  ended: { icon: IconName; label: string } | null;
  tallies: { status: keyof IRunCounts; icon: IconName; count: number }[];
  facts: string;
  startedAt: string;
}
