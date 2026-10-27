import type { ProUploader } from './ProUploader';
import type { ProApi } from '@/main/classes/pro/ProApi';
import type { IProShare } from '@/shared/types';

/**
 * What the sync needs: the platform, the token and org, the archive, the uploads, a clock
 * and a timer.
 */
export interface IProSync {
  api: Pick<
    ProApi,
    | 'syncProject'
    | 'syncPlan'
    | 'syncRun'
    | 'syncBug'
    | 'syncRecordings'
    | 'evidenceUpload'
    | 'syncedProjects'
  >;
  target: () => Promise<{ token: string; orgSlug: string } | null>;
  machineName: string;
  file: string;
  archiveRoot: string;
  videoOf: (run: { workspaceId: string; runId: string }) => Promise<string | null>;
  isVideoRemoved: (run: { workspaceId: string; runId: string }) => Promise<boolean>;
  variablesOf: (projectId: string) => Promise<{ name: string; description: string }[]>;
  upload: ProUploader;
  now: () => Date;
  schedule: (props: { ms: number; run: () => void }) => () => void;
  onShare: (share: IProShare) => void;
}
