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

/** How the Estagiário looks over the device: asleep with nothing to run, busy while it runs, and how it ended. */
export function moodOfStatus(status: WorkspaceStatus | null): InternMood {
  return status === null ? 'sleeping' : MOODS[status];
}
