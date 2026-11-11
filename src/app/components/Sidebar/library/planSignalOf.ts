import type { IPlanSignal } from '@/app/components/Sidebar/types';
import type { WorkspaceStatus } from '@/modules/Workspace';

/**
 * O sinal da linha de um plano: uma pergunta, uma run andando ou pausada, os bugs
 * abertos ou uma run que falhou; null quando nada pede o QA.
 */
export function planSignalOf(props: {
  shown: WorkspaceStatus | 'paused';
  bugs: number;
}): IPlanSignal | null {
  const { shown, bugs } = props;

  if (shown === 'attention') return { kind: 'asking', count: 0 };
  if (shown === 'running' || shown === 'paused') return { kind: shown, count: 0 };
  if (bugs > 0) return { kind: 'bugs', count: bugs };
  if (shown === 'failed') return { kind: 'failed', count: 0 };

  return null;
}
