import type { ISuiteAttachment } from './ISuiteAttachment';
import type { SuiteTestStatus } from './SuiteTestStatus';

/** How one test went in a run: where it is written, how it ended, whether it passed only on a retry, how long it took, the first error it threw, and what it left behind. */
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
