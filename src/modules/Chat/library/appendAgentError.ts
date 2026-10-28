import type { IWorkspace } from '@/modules/Workspace';

/**
 * Um agente quebrado é um erro do QAzinho, nunca um resultado de teste: ganha um bloco
 * próprio, guardado com a run que ele parou.
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
