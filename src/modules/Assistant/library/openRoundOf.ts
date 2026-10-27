import type { IWorkspace } from '@/modules/Workspace/types';
import type { IChatQuestion } from '@/shared/types';

/**
 * The questions a workspace's chat agent asked the QA and still waits on: only its latest
 * message counts, since a newer one leaves a round behind.
 */
export function openRoundOf(workspace: Pick<IWorkspace, 'chat'>): IChatQuestion[] {
  const last = workspace.chat.at(-1);

  return last?.kind === 'questions' && last.answers === null ? last.questions : [];
}
