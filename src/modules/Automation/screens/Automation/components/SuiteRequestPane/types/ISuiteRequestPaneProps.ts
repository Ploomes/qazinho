import type { ISuiteChange, SuiteChangeNote } from '@/modules/Automation/types';

/**
 * A new test asked of the agent, picked: the ask, what the agent did meanwhile and its
 * name, and what the QA can do with it.
 */
export interface ISuiteRequestPaneProps {
  change: ISuiteChange;
  notes: SuiteChangeNote[];
  agent: string;
  onStop: () => void;
  onReview: () => void;
  onDiscard: () => void;
  onRetry: () => void;
}
