import type { IProject } from '@/modules/Project';
import type { IWorkspace } from '@/modules/Workspace';
import { countOf } from '@/modules/Assistant/library';

/**
 * Todo projeto e workspace do QA para um agente de fora achar o que rodar: o que cada um
 * testa, o tamanho do plano, como foi a última run e o que anda agora.
 */
export function describeWorkspaces(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
}): string {
  if (props.projects.length === 0)
    return 'QAzinho has no projects yet: the QA makes one in the app.';

  return props.projects
    .flatMap((project) => {
      const own = props.workspaces.filter(({ projectId }) => projectId === project.id);

      return [
        `Project ${project.id} "${project.name}":`,
        ...(own.length === 0
          ? ['  no workspaces yet: the QA makes one in the app.']
          : own.map((workspace) => `  ${lineOf({ project, workspace })}`)),
      ];
    })
    .join('\n');
}

function lineOf(props: { project: IProject; workspace: IWorkspace }): string {
  const { project, workspace } = props;
  const target = project.targets.find(({ id }) => id === workspace.targetId);
  const steps = workspace.plan.reduce((total, one) => total + one.steps.length, 0);
  const [last] = workspace.runs;
  const openBugs = workspace.bugs.filter(({ isDismissed }) => !isDismissed).length;
  const live = workspace.live;

  return [
    `${workspace.id} "${workspace.name}"`,
    target === undefined ? 'a target that is gone' : `${target.kind} ${target.value}`,
    workspace.plan.length === 0
      ? 'no plan yet'
      : `${countOf({ amount: workspace.plan.length, noun: 'case' })} and ${countOf({ amount: steps, noun: 'step' })}`,
    last === undefined
      ? 'never run'
      : `last run ${last.id}: ${countOf({ amount: last.counts.passed, noun: 'step' })} passed, ${String(last.counts.failed)} failed`,
    countOf({ amount: openBugs, noun: 'open bug' }),
    ...(live !== null && !live.isDone
      ? [
          live.question === undefined
            ? `${live.id} going on now`
            : `${live.id} going on now, its agent waits for the QA`,
        ]
      : []),
  ].join(' · ');
}
