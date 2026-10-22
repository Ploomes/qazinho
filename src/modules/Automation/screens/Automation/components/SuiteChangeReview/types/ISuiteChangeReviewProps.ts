import type { ISuiteChange } from '@/modules/Automation/types';

/** The change the QA reviews before it leaves their machine, whether GitHub can open its pull request, and how the review closes. */
export interface ISuiteChangeReviewProps {
  change: ISuiteChange;
  canOpenPullRequest: boolean;
  onClose: () => void;
}
