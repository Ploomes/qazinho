import type { IUserCommand } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace';

/** Puts what the QA sent at the end of the chat: their words, trimmed, with what they mentioned and the command they gave. */
export function appendUserMessage(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
  mentions?: string[];
  command?: IUserCommand;
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
