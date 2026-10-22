import type { ISuiteChange } from '@/modules/Automation/types';

/** The new tests asked of the agent, the latest first, the one picked, and how to pick one. */
export interface ISuiteRequestsProps {
  requests: ISuiteChange[];
  pickedId: string | null;
  onPick: (changeId: string) => void;
}
