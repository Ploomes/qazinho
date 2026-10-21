import type { IBuild } from '@/modules/Build/types';
import type { IBuildEvent } from '@/shared/types';

/** The builds of this session, newest first, each followed through its events. */
export interface IBuildStore {
  builds: IBuild[];
  startBuild: (build: IBuild) => void;
  followBuild: (event: IBuildEvent) => void;
}
