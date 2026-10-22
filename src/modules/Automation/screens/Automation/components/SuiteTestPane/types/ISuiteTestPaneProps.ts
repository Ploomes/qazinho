import type {
  ISuiteChange,
  ISuiteRun,
  ISuiteTest,
  SuiteChangeNote,
} from '@/modules/Automation/types';

/** The test the QA picked, the project's runs to read how it went in each, the latest first, the step it is on while it runs, and the agent's fix of it: whether one can start and why, or the one under way, with what the agent says. */
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
