import type { IWorkspace } from '@/modules/Workspace/types';

/**
 * Um workspace novo e vazio num projeto, ainda sem alvo, como o de um plano que começa
 * por uma história antes de o app existir.
 */
export function blankWorkspaceOf(props: {
  projectId: string;
  name: string;
  now: number;
}): IWorkspace {
  return {
    id: `w-${String(props.now)}`,
    projectId: props.projectId,
    name: props.name,
    targetId: '',
    planKind: 'web',
    sessionId: null,
    sessionAgentId: null,
    status: 'idle',
    issue: null,
    design: null,
    chat: [],
    plan: [],
    runs: [],
    bugs: [],
    live: null,
    hasBeenAsked: false,
    planSource: null,
    sourcePage: null,
    unreadPlan: null,
    plainValues: [],
    published: null,
    viewportId: 'desktop',
    context: null,
  };
}
