import type { UserCommand } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IChatAttachment } from '@/shared/types';

/**
 * Põe o que o QA, ou o agente de código dele, mandou no fim do chat: as palavras sem
 * espaços nas pontas, o que mencionou, o comando que deu e os arquivos que anexou.
 */
export function appendUserMessage(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
  mentions?: string[];
  command?: UserCommand;
  from?: 'agent';
  attachments?: IChatAttachment[];
}): IWorkspace {
  const { workspace, text, at, mentions = [], command, from, attachments = [] } = props;
  const trimmed = text.trim();

  if (trimmed.length === 0 && command === undefined && attachments.length === 0)
    return workspace;

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
        ...(from === undefined ? {} : { from }),
        ...(attachments.length === 0 ? {} : { attachments }),
      },
    ],
  };
}
