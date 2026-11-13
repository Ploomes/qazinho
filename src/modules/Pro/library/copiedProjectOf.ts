import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';

/**
 * Uma cópia de um projeto como um novo deste computador: os mesmos alvos e código, e cada
 * workspace com um plano, levando só o plano.
 */
export function copiedProjectOf(props: {
  project: IProject;
  workspaces: IWorkspace[];
  name: string;
  now: number;
}): { project: IProject; workspaces: IWorkspace[] } {
  const { project, workspaces, name, now } = props;
  const id = `p-${String(now)}`;
  const copied = workspaces.filter(
    (workspace) => workspace.projectId === project.id && workspace.plan.length > 0,
  );
  const copyIdOf = (index: number) => `w-${String(now)}-${String(index)}`;

  return {
    project: {
      id,
      name,
      targets: project.targets.map((target) => ({ ...target })),
      repositories: project.repositories.map((repository) => ({ ...repository })),
      memories: (project.memories ?? []).flatMap((memory) => {
        const index = copied.findIndex(({ id: from }) => from === memory.workspaceId);

        return memory.deletedAt !== null || (memory.scope === 'plan' && index === -1)
          ? []
          : [{ ...memory, workspaceId: index === -1 ? null : copyIdOf(index) }];
      }),
    },
    workspaces: copied.map((workspace, index) => ({
      id: copyIdOf(index),
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
      strategy: workspace.strategy ?? null,
      doubts: workspace.doubts ?? [],
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
