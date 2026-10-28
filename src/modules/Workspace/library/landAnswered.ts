import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunAsked } from '@/shared/types';

/**
 * Uma pergunta ao QA terminou, respondida ou não: a run segue, guarda como terminou para
 * o passo em que foi feita, e a seção dela no chat diz isso uma vez.
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
