import type { WorkspaceStatus } from '@/modules/Workspace';
import type { InternMood } from '@/shared/components/atoms/Intern/types';

const MOODS: Record<WorkspaceStatus, InternMood> = {
  idle: 'sleeping',
  running: 'running',
  attention: 'thinking',
  stopped: 'neutral',
  passed: 'passed',
  failed: 'bug',
};

/**
 * Como o Estagiário aparece sobre o dispositivo: dormindo sem nada para rodar, ocupado
 * enquanto roda, e como terminou.
 */
export function moodOfStatus(status: WorkspaceStatus | null): InternMood {
  return status === null ? 'sleeping' : MOODS[status];
}
