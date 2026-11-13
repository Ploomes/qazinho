import type { IWorkspace } from '@/modules/Workspace';

/** Conta no chat do workspace quais skills do time o agente recebeu neste turno. */
export function appendSkillsNote(props: {
  workspace: IWorkspace;
  names: string[];
  at: string;
}): IWorkspace {
  const { workspace, names, at } = props;

  if (names.length === 0) return workspace;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      { id: `m-${String(workspace.chat.length + 1)}`, kind: 'skills', at, names },
    ],
  };
}
