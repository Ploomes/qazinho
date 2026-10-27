import type { IWorkspace } from '@/modules/Workspace';

/**
 * A broken agent is a QAzinho error, never a test result: it gets its own block, kept
 * with the run it stopped.
 */
export function appendAgentError(props: {
  workspace: IWorkspace;
  text: string;
  at: string;
  runId?: string | null;
}): IWorkspace {
  const { workspace, text, at } = props;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'error',
        runId: props.runId ?? null,
        at,
        text: text.trim(),
        fix: null,
      },
    ],
  };
}
