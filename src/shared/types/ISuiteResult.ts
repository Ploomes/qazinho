import type { ISuiteAttachment } from './ISuiteAttachment';
import type { SuiteTestStatus } from './SuiteTestStatus';

/**
 * Como um teste foi numa run: onde está escrito, como terminou, se passou só numa nova
 * tentativa, quanto levou, o primeiro erro que lançou, e o que deixou.
 */
export interface ISuiteResult {
  testId: string;
  title: string;
  file: string;
  line: number;
  project: string;
  status: SuiteTestStatus;
  isFlaky: boolean;
  durationMs: number;
  error: string | null;
  attachments: ISuiteAttachment[];
}
