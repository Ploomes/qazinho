import type { ILastResult, ISuiteFolder } from '@/modules/Automation/types';

/**
 * Os testes de uma suíte por pasta e arquivo: como cada um foi, quais rodam e em que
 * passo, o escolhido, as pastas que o QA fechou, e as runs que ela pode iniciar.
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
