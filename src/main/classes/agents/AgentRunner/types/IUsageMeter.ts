import type { UsageKind } from '@/shared/types';

/** Para que uma chamada ao agente serve, e o workspace e o projeto que ela paga. */
export interface IUsageMeter {
  kind: UsageKind;
  workspaceId: string | null;
  projectId: string | null;
}
