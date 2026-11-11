import type { IBug } from '@/modules/Bug/types';

export interface IBugUpdateProps {
  workspaceId: string;
  bug: IBug;
}
