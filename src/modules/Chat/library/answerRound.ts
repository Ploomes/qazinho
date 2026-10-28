import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace';

/**
 * Guarda as respostas do QA na rodada que elas respondem, para o chat mostrar o que ele
 * escolheu.
 */
export function answerRound(props: {
  workspace: IWorkspace;
  messageId: string;
  answers: IQuestionAnswer[];
}): IWorkspace {
  const { workspace, messageId, answers } = props;

  return {
    ...workspace,
    chat: workspace.chat.map((message) =>
      message.kind === 'questions' && message.id === messageId && message.answers === null
        ? { ...message, answers }
        : message,
    ),
  };
}
