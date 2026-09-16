import type { IResourceSnapshot } from '@/types';

/** A machine that has not answered yet costs nothing, rather than showing an invented number. */
export const NO_RESOURCES: IResourceSnapshot = {
  cpu: 0,
  ramMb: 0,
  ramCeilingGb: 32,
  processes: [],
};
