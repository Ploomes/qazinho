import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunAsked } from '@/shared/types';

/**
 * A question to the QA ended, answered or not: the run goes on, keeps how it ended for
 * the step it was asked at, and its section in the chat says so once.
 */
export function landAnswered(props: {
  workspace: IWorkspace;
  asked: IRunAsked;
  at: string;
}): IWorkspace {
  const { workspace, asked, at } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  const { question, ...rest } = live;
  const isSaid = workspace.chat.some(
    (message) =>
      message.kind === 'ask' && message.runId === live.id && message.askId === asked.id,
  );

  return {
    ...workspace,
    live: {
      ...(question?.id === asked.id ? rest : live),
      asked: [...(live.asked ?? []).filter(({ id }) => id !== asked.id), asked],
    },
    chat: isSaid
      ? workspace.chat
      : [
          ...workspace.chat,
          {
            id: `m-${String(workspace.chat.length + 1)}`,
            kind: 'ask',
            at,
            runId: live.id,
            askId: asked.id,
            question: asked.question,
            caseId: asked.caseId,
            stepNumber: asked.stepNumber,
            answer: asked.answer,
          },
        ],
  };
}
