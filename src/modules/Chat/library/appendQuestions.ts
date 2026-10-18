import type { IWorkspace } from '@/modules/Workspace';
import type { IChatQuestion } from '@/shared/types';

/** Adds a round of the agent's questions to the chat, waiting for the QA; a round with none adds nothing. */
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
