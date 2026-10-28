import type { BugVideo } from './BugVideo';
import type { IBugReport } from './IBugReport';
import type { IEvidenceShot } from './IEvidenceShot';
import type { IssueTarget } from './IssueTarget';

/**
 * Um bug que o QA manda ao tracker dele: para onde vai, a história do Jira de onde veio,
 * o que diz, e as telas e o vídeo que vão com ele.
 */
export interface IFileBug {
  filingId: string;
  target: IssueTarget;
  story: string | null;
  report: IBugReport;
  shots: IEvidenceShot[];
  video: BugVideo | null;
}
