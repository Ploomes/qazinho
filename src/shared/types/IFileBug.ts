import type { BugVideo } from './BugVideo';
import type { IBugReport } from './IBugReport';
import type { IEvidenceShot } from './IEvidenceShot';
import type { IssueTarget } from './IssueTarget';

/**
 * A bug the QA sends to their tracker: where it goes, the Jira story it came from, what
 * it says, and the screens and video that go with it.
 */
export interface IFileBug {
  filingId: string;
  target: IssueTarget;
  story: string | null;
  report: IBugReport;
  shots: IEvidenceShot[];
  video: BugVideo | null;
}
