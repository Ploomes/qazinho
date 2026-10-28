import type { IWorkspace } from '@/modules/Workspace';
import type { IChatQuestion } from '@/shared/types';

/**
 * Acrescenta uma rodada de perguntas do agente ao chat, esperando pelo QA; uma rodada sem
 * nenhuma não acrescenta nada.
 */
export function appendQuestions(props: {
  workspace: IWorkspace;
  questions: IChatQuestion[];
  at: string;
}): IWorkspace {
  const { workspace, questions, at } = props;

  if (questions.length === 0) return workspace;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'questions',
        at,
        questions,
        answers: null,
      },
    ],
  };
}
