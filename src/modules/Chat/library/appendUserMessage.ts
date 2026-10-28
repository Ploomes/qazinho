import type { UserCommand } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace';

/**
 * Põe o que o QA mandou no fim do chat: as palavras dele, sem espaços nas pontas, com o
 * que mencionou e o comando que deu.
 */
export function appendUserMessage(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
  mentions?: string[];
  command?: UserCommand;
}): IWorkspace {
  const { workspace, text, at, mentions = [], command } = props;
  const trimmed = text.trim();

  if (trimmed.length === 0 && command === undefined) return workspace;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'user',
        at,
        text: trimmed,
        ...(mentions.length > 0 ? { mentions } : {}),
        ...(command === undefined ? {} : { command }),
      },
    ],
  };
}
