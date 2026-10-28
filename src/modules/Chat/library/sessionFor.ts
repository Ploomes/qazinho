import type { IWorkspace } from '@/modules/Workspace';

/**
 * A sessão em que o chat do workspace continua, só com o agente que a iniciou: outro
 * agente inicia a própria.
 */
export function sessionFor(props: {
  workspace: Pick<IWorkspace, 'sessionId' | 'sessionAgentId'>;
  agentId: string;
}): string | null {
  const { workspace, agentId } = props;
  const isTheirs =
    workspace.sessionAgentId === null || workspace.sessionAgentId === agentId;

  return isTheirs ? workspace.sessionId : null;
}
