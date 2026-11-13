import type { IssueSource, IWorkspace } from '@/modules/Workspace/types';
import type { IProSyncPlan } from '@/shared/types';
import { toPlanKind } from '@/modules/Plan/library';
import { testCasesOf } from './testCasesOf';

/**
 * Um plano baixado da org como um workspace deste computador, ainda sem nada andado aqui.
 */
export function workspaceOfPlan(props: {
  plan: IProSyncPlan;
  projectId: string;
}): IWorkspace {
  const { plan, projectId } = props;
  const source: IssueSource | null =
    plan.issue?.source === 'jira'
      ? 'jira'
      : plan.issue?.source === 'github'
        ? 'github'
        : null;
  const issue =
    plan.issue === null || source === null
      ? null
      : { key: plan.issue.key, title: plan.issue.title, url: plan.issue.url, source };

  return {
    id: plan.workspaceId,
    projectId,
    name: plan.name,
    targetId: plan.targetId,
    planKind: toPlanKind(plan.targetKind),
    viewportId: 'desktop',
    sessionId: null,
    sessionAgentId: null,
    context: null,
    status: 'idle',
    issue,
    design: plan.design,
    chat: [],
    plan: testCasesOf({ cases: plan.cases, local: [] }),
    strategy: plan.strategy ?? null,
    doubts: plan.doubts ?? [],
    unreadPlan: null,
    plainValues: [],
    planSource: null,
    sourcePage: null,
    published: null,
    runs: [],
    bugs: [],
    live: null,
    hasBeenAsked: false,
  };
}
