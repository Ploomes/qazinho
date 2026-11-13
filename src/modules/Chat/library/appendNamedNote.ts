import type { NameOrigin } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace';

/** Conta no chat do workspace o nome que o projeto ganhou, e de onde ele veio. */
export function appendNamedNote(props: {
  workspace: IWorkspace;
  named: { projectId: string; name: string; from: NameOrigin };
  at: string;
}): IWorkspace {
  const { workspace, named, at } = props;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      { id: `m-${String(workspace.chat.length + 1)}`, kind: 'named', at, ...named },
    ],
  };
}
