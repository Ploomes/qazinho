import type { IWorkspace } from '@/modules/Workspace/types';

export function appendUserMessage(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
}): IWorkspace {
  const { workspace, text, at } = props;
  const trimmed = text.trim();

  if (trimmed.length === 0) return workspace;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      { id: `m-${String(workspace.chat.length + 1)}`, kind: 'user', at, text: trimmed },
    ],
  };
}
