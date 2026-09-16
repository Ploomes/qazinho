import type { ProcessKind } from '@/types';

export interface IProcessClaim {
  workspaceId: string | null;
  kind: ProcessKind;
}
