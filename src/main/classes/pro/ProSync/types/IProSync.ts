import type { ProDownloader } from './ProDownloader';
import type { ProUploader } from './ProUploader';
import type { ProApi } from '@/main/classes/pro/ProApi';
import type { IProShare } from '@/shared/types';

/**
 * O que a sincronização precisa: a plataforma, o token, o arquivo, os uploads e um
 * relógio.
 */
export interface IProSync {
  api: Pick<
    ProApi,
    | 'syncProject'
    | 'syncPlan'
    | 'syncRun'
    | 'syncBug'
    | 'syncMemories'
    | 'syncRecordings'
    | 'evidenceUpload'
    | 'keepTestFile'
    | 'testFileAddress'
    | 'syncedProjects'
    | 'deleteProject'
  >;
  token: () => Promise<string | null>;
  machineName: string;
  file: string;
  archiveRoot: string;
  videoOf: (run: { workspaceId: string; runId: string }) => Promise<string | null>;
  isVideoRemoved: (run: { workspaceId: string; runId: string }) => Promise<boolean>;
  variablesOf: (projectId: string) => Promise<{ name: string; description: string }[]>;
  upload: ProUploader;
  download: ProDownloader;
  now: () => Date;
  schedule: (props: { ms: number; run: () => void }) => () => void;
  onShare: (share: IProShare) => void;
}
