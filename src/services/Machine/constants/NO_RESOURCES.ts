import type { IResourceSnapshot } from '@/shared/types';

export const NO_RESOURCES: IResourceSnapshot = {
  cpu: 0,
  ramMb: 0,
  ramCeilingGb: 32,
  processes: [],
};
