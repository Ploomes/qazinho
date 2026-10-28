import type { IWorkspace } from '@/modules/Workspace';

/**
 * Uma run segurada para de contar: o relógio diz quanto tempo o dispositivo foi
 * trabalhado, não esperado, e uma pergunta conta quanto tempo o QA a deixou esperando.
 */
export function tickLive(props: { workspace: IWorkspace; seconds: number }): IWorkspace {
  const { workspace, seconds } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  if (live.question !== undefined)
    return {
      ...workspace,
      live: {
        ...live,
        question: { ...live.question, waitedSec: live.question.waitedSec + seconds },
      },
    };

  if (!live.isRunning) return workspace;

  return { ...workspace, live: { ...live, elapsedSec: live.elapsedSec + seconds } };
}
