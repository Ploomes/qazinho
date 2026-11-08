import type { IMemoryChange } from '@/modules/Memory/types';
import type { IWorkspace } from '@/modules/Workspace';

/** Conta no chat do workspace o que o agente aprendeu ou corrigiu. */
export function appendMemoryNote(props: {
  workspace: IWorkspace;
  changes: IMemoryChange[];
  at: string;
}): IWorkspace {
  const { workspace, changes, at } = props;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      { id: `m-${String(workspace.chat.length + 1)}`, kind: 'memory', at, changes },
    ],
  };
}
