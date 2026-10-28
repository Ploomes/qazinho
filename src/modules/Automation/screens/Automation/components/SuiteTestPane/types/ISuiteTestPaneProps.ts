import type {
  ISuiteChange,
  ISuiteRun,
  ISuiteTest,
  SuiteChangeNote,
} from '@/modules/Automation/types';

/**
 * O teste escolhido, as runs dele, o passo em que está, e o conserto do agente para ele
 * com o que o agente diz.
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
