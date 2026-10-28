import type { IWorkspace } from '@/modules/Workspace/types';
import type { IChatQuestion } from '@/shared/types';

/**
 * As perguntas que o agente do chat de um workspace fez ao QA e ainda espera: só a última
 * mensagem conta, já que uma mais nova deixa uma rodada para trás.
 */
export function openRoundOf(workspace: Pick<IWorkspace, 'chat'>): IChatQuestion[] {
  const last = workspace.chat.at(-1);

  return last?.kind === 'questions' && last.answers === null ? last.questions : [];
}
