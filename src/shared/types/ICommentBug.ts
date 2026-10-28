import type { BugVideo } from './BugVideo';
import type { IBugReport } from './IBugReport';
import type { IEvidenceShot } from './IEvidenceShot';
import type { IFiledIssue } from './IFiledIssue';

/**
 * Uma atualização que o QA posta sob a issue de um bug: o comentário, e as telas e o
 * vídeo que vão com ele.
 */
export interface ICommentBug {
  issue: IFiledIssue;
  report: IBugReport;
  shots: IEvidenceShot[];
  video: BugVideo | null;
}
