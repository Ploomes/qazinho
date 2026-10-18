import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace';

/** Keeps the QA's answers on the round they answer, so the chat shows what they picked. */
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
