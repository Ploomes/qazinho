import type { PlanSignalKind } from '@/app/components/Sidebar/types';
import type { WorkspaceStatus } from '@/modules/Workspace';

/**
 * O sinal da linha de um plano: uma pergunta, uma run andando ou pausada, ou a última
 * run que falhou; null quando nada pede o QA, bugs abertos incluídos.
 */
export function planSignalOf(shown: WorkspaceStatus | 'paused'): PlanSignalKind | null {
  if (shown === 'attention') return 'asking';
  if (shown === 'running' || shown === 'paused' || shown === 'failed') return shown;

  return null;
}
