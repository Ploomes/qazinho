import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';

/**
 * A copy of a project as a new one of this computer: the same targets and code, and each
 * workspace with a plan, carrying the plan alone.
 */
export function copiedProjectOf(props: {
  project: IProject;
  workspaces: IWorkspace[];
  name: string;
  now: number;
}): { project: IProject; workspaces: IWorkspace[] } {
  const { project, workspaces, name, now } = props;
  const id = `p-${String(now)}`;

  return {
    project: {
      id,
      name,
      targets: project.targets.map((target) => ({ ...target })),
      repositories: project.repositories.map((repository) => ({ ...repository })),
    },
    workspaces: workspaces
      .filter(
        (workspace) => workspace.projectId === project.id && workspace.plan.length > 0,
      )
      .map((workspace, index) => ({
        id: `w-${String(now)}-${String(index)}`,
        projectId: id,
        name: workspace.name,
        targetId: workspace.targetId,
        planKind: workspace.planKind,
        viewportId: workspace.viewportId,
        sessionId: null,
        sessionAgentId: null,
        context: null,
        status: 'idle',
        issue: workspace.issue,
        design: workspace.design,
        chat: [],
        plan: workspace.plan.map((testCase) => ({ ...testCase, lastVerdict: null })),
        unreadPlan: null,
        plainValues: [],
        planSource: null,
        sourcePage: null,
        published: null,
        runs: [],
        bugs: [],
        live: null,
        hasBeenAsked: false,
      })),
  };
}
