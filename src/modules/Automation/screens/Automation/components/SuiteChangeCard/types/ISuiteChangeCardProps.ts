import type { ISuiteChange, SuiteChangeNote } from '@/modules/Automation/types';

/**
 * A change the agent made for the test picked, as it stands, what the agent said
 * meanwhile and its name, and what the QA can do with it.
 */
export interface ISuiteChangeCardProps {
  change: ISuiteChange;
  notes: SuiteChangeNote[];
  agent: string;
  onStop: () => void;
  onReview: () => void;
  onDiscard: () => void;
  onRetry: () => void;
}
