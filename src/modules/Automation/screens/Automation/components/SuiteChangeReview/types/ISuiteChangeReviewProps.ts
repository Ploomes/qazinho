import type { ISuiteChange } from '@/modules/Automation/types';

/**
 * A mudança que o QA revisa antes de sair da máquina dele, se o GitHub consegue abrir o
 * pull request dela, e como a revisão fecha.
 */
export interface ISuiteChangeReviewProps {
  change: ISuiteChange;
  canOpenPullRequest: boolean;
  onClose: () => void;
}
