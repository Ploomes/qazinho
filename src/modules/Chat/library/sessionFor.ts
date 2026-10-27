import type { IWorkspace } from '@/modules/Workspace';

/**
 * The session the workspace's chat goes on in, only with the agent that started it:
 * another agent starts its own.
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
