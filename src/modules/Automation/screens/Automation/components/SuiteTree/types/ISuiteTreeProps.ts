import type { ILastResult, ISuiteFolder } from '@/modules/Automation/types';

/**
 * A suite's tests by folder and file: how each went last, which are running and the step
 * each is on, the test picked, the folders the QA shut, and the runs it can start.
 */
export interface ISuiteTreeProps {
  folders: ISuiteFolder[];
  last: Record<string, ILastResult>;
  going: Record<string, string | null>;
  pickedId: string | null;
  shut: string[];
  isQuerying: boolean;
  canRun: boolean;
  onToggle: (path: string) => void;
  onPick: (testId: string) => void;
  onRunPath: (path: string) => void;
  onRunTest: (testId: string) => void;
}
