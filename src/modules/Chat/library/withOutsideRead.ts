import type { IWorkspace } from '@/modules/Workspace';

/**
 * Marca a hora em que o agente de código leu a resposta à última mensagem dele no chat;
 * uma já lida guarda a primeira hora.
 */
export function withOutsideRead(props: {
  workspace: IWorkspace;
  at: string;
}): IWorkspace {
  const { workspace, at } = props;
  const index = workspace.chat.findLastIndex(
    (message) => message.kind === 'user' && message.from === 'agent',
  );
  const asked = workspace.chat[index];

  if (asked?.kind !== 'user' || asked.readAt !== undefined) return workspace;

  return {
    ...workspace,
    chat: workspace.chat.map((message, at_) =>
      at_ === index && message.kind === 'user' ? { ...message, readAt: at } : message,
    ),
  };
}
