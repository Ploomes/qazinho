import type { ProApi } from '@/main/classes/pro/ProApi';
import type { ProSync } from '@/main/classes/pro/ProSync';

/** What downloading from an org needs: the platform, this machine's token, the archive the recordings go to, and the sync that keeps the project shared. */
export interface IProDownloads {
  api: Pick<ProApi, 'syncedProjects' | 'recordings'>;
  token: () => Promise<string | null>;
  archiveRoot: string;
  sync: Pick<ProSync, 'adopt'>;
}
