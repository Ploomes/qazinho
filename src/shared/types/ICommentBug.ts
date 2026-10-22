import type { BugVideo } from './BugVideo';
import type { IBugReport } from './IBugReport';
import type { IEvidenceShot } from './IEvidenceShot';
import type { IFiledIssue } from './IFiledIssue';

/** An update the QA posts under a bug's issue: the comment, and the screens and video that go with it. */
export interface ICommentBug {
  issue: IFiledIssue;
  report: IBugReport;
  shots: IEvidenceShot[];
  video: BugVideo | null;
}
