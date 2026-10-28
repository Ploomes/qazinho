import type { IWorkspace } from '@/modules/Workspace';
import { appendAgentMessage } from './appendAgentMessage';

/**
 * Uma nota que o agente deixou enquanto andava um passo, guardada com a run que ele anda
 * e assinada pelo agente que a anda.
 */
export function appendRunNote(props: {
  workspace: IWorkspace;
  text: string;
  who: string;
  at: string;
}): IWorkspace {
  const { workspace, text, at } = props;
  const said = text.trim();
  const { live } = workspace;

  if (!live || live.isDone) return appendAgentMessage(props);

  if (said.length === 0) return workspace;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'note',
        at,
        runId: live.id,
        who: live.by.agent,
        text: said,
      },
    ],
  };
}
