import type { IWorkspace } from '@/modules/Workspace/types';

export function appendAgentMessage(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
}): IWorkspace {
  const { workspace, text, at } = props;
  const said = text.trim();

  if (said.length === 0) return workspace;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'agent',
        at,
        who: 'Claude',
        text: said,
      },
    ],
  };
}
