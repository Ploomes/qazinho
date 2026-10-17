import type { IWorkspace } from '@/modules/Workspace/types';

/** A broken agent is a QAzinho error, never a test result: it gets its own block. */
export function appendAgentError(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
}): IWorkspace {
  const { workspace, text, at } = props;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'error',
        at,
        text: text.trim(),
        fix: null,
      },
    ],
  };
}
