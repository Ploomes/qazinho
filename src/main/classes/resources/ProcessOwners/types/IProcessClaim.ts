import type { ProcessKind } from '@/shared/types';

export interface IProcessClaim {
  workspaceId: string | null;
  kind: ProcessKind;
}
