import type { ProUploader } from './ProUploader';
import type { ProApi } from '@/main/classes/pro/ProApi';
import type { IProShare } from '@/shared/types';

/** What the sync needs: the platform, this machine's token and name, its own file, the archive it reads from, where a run's video lives, the variables' names, the upload, a clock and a timer a test can drive. */
export interface IProSync {
  api: Pick<
    ProApi,
    | 'syncProject'
    | 'syncPlan'
    | 'syncRun'
    | 'syncBug'
    | 'syncRecordings'
    | 'evidenceUpload'
  >;
  token: () => Promise<string | null>;
  machineName: string;
  file: string;
  archiveRoot: string;
  videoOf: (run: { workspaceId: string; runId: string }) => Promise<string | null>;
  variablesOf: (projectId: string) => Promise<{ name: string; description: string }[]>;
  upload: ProUploader;
  now: () => Date;
  schedule: (props: { ms: number; run: () => void }) => () => void;
  onShare: (share: IProShare) => void;
}
