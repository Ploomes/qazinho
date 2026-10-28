import type { ProApi } from '@/main/classes/pro/ProApi';
import type { ProSync } from '@/main/classes/pro/ProSync';

/**
 * O que baixar de uma org precisa: a plataforma, o token desta máquina, o arquivo onde
 * vão as gravações, e a sincronização que mantém o projeto compartilhado.
 */
export interface IProDownloads {
  api: Pick<ProApi, 'syncedProjects' | 'recordings'>;
  token: () => Promise<string | null>;
  archiveRoot: string;
  sync: Pick<ProSync, 'adopt'>;
}
