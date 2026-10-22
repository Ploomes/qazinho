import type { IGithubFiling } from './IGithubFiling';
import type { IJiraFiling } from './IJiraFiling';
import type { IEvidenceShot, IFilingEvent, IRunRef } from '@/shared/types';

export interface IBugFiler {
  jira: IJiraFiling;
  github: IGithubFiling;
  readShot: (shot: IEvidenceShot) => Promise<Buffer | null>;
  recordingOf: (run: IRunRef) => Promise<string | null>;
  onEvent: (event: IFilingEvent) => void;
  now: () => Date;
}
