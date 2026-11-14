import type { IWorkspace } from '@/modules/Workspace/types';
import type { IChatQuestion } from '@/shared/types';
import { lastSaidOf } from '@/modules/Chat/library/lastSaidOf';

/**
 * As perguntas que o agente do chat de um workspace ainda espera: só a última mensagem
 * conta, sem as notas ao lado, já que uma mais nova deixa uma rodada para trás.
 */
export function openRoundOf(workspace: Pick<IWorkspace, 'chat'>): IChatQuestion[] {
  const last = lastSaidOf(workspace.chat);

  return last?.kind === 'questions' && last.answers === null ? last.questions : [];
}
