import type { KeepEvent } from '@/shared/types';

/** Algo a pesar contra o que o agente guarda: de onde veio e o que aconteceu. */
export interface IKeepRequest {
  projectId: string;
  workspaceId: string;
  events: KeepEvent[];
}
