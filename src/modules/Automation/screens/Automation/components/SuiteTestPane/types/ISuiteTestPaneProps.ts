import type {
  ISuiteChange,
  ISuiteRun,
  ISuiteTest,
  SuiteChangeNote,
} from '@/modules/Automation/types';

/**
 * The picked test, its runs, the step it is on, and the agent's fix of it with what the
 * agent says.
 */
export interface ISuiteTestPaneProps {
  projectId: string;
  test: ISuiteTest;
  runs: ISuiteRun[];
  step: string | null;
  isRunning: boolean;
  canRun: boolean;
  hasProjects: boolean;
  fix: { canFix: boolean; note: string } | null;
  change: ISuiteChange | null;
  notes: SuiteChangeNote[];
  agent: string;
  onRun: (testId: string) => void;
  onFix: () => void;
  onStopFix: () => void;
  onReview: () => void;
  onDiscard: () => void;
}
