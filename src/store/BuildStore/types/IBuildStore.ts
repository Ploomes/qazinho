import type { IBuild } from '@/modules/Build/types';
import type { IBuildEvent } from '@/shared/types';

/**
 * Os builds desta sessão, os mais novos primeiro, cada um acompanhado pelos eventos dele.
 */
export interface IBuildStore {
  builds: IBuild[];
  startBuild: (build: IBuild) => void;
  followBuild: (event: IBuildEvent) => void;
}
