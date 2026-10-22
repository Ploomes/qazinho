import type { ISuiteRun, ISuiteTest } from '@/modules/Automation/types';

/** The test the QA picked, the project's runs to read how it went in each, the latest first, and the step it is on while it runs. */
export interface ISuiteTestPaneProps {
  projectId: string;
  test: ISuiteTest;
  runs: ISuiteRun[];
  step: string | null;
  isRunning: boolean;
  canRun: boolean;
  hasProjects: boolean;
  onRun: (testId: string) => void;
}
