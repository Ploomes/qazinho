import type { IHarnessSection } from '@/harness/context/types';
import type { IAppRunBrief, IAppSnapshot, IAppWorkspaceBrief } from '@/shared/types';
import { LANGUAGE_NAMES, SCREEN_NAMES, THEME_NAMES } from '@/harness/constants';

const ENDINGS: Record<IAppRunBrief['endedBy'], string> = {
  finished: 'walked the whole plan',
  stopped: 'stopped by the QA',
  broke: 'broke before the end',
  interrupted: 'cut short when QAzinho closed',
};

const INTEGRATION_NAMES = { github: 'GitHub', jira: 'Jira' } as const;

function plural(props: { count: number; one: string }): string {
  return `${String(props.count)} ${props.one}${props.count === 1 ? '' : 's'}`;
}

function workspaceLine(workspace: IAppWorkspaceBrief): string {
  const run = workspace.latestRun;
  const parts = [
    workspace.cases === 0
      ? 'no plan yet'
      : `${plural({ count: workspace.cases, one: 'case' })}, ${plural({ count: workspace.steps, one: 'step' })}`,
    run === null
      ? 'no runs'
      : `${plural({ count: workspace.runs, one: 'run' })}, the latest ${run.id} at ${run.startedAt} ${ENDINGS[run.endedBy]}: ${String(run.passed)} passed, ${String(run.failed)} failed, ${String(run.blocked)} blocked, ${String(run.skipped)} skipped`,
    workspace.bugs === 0 ? 'no bugs' : plural({ count: workspace.bugs, one: 'bug' }),
    ...(workspace.isRunning ? ['running now'] : []),
    ...(workspace.isAnswering ? ['its chat agent is answering'] : []),
  ];

  return `- ${workspace.id} "${workspace.name}" in ${workspace.projectId}, on ${workspace.target ?? 'no target'}: ${parts.join(' · ')}`;
}

/** QAzinho as it is now: how the QA set it up, the trackers, and every project and workspace by id. */
export function describeApp(app: IAppSnapshot): IHarnessSection {
  const integrations = app.integrations.map(({ id, account }) =>
    account === null
      ? `${INTEGRATION_NAMES[id]} is not connected.`
      : `${INTEGRATION_NAMES[id]} is connected as ${account}.`,
  );

  return {
    title: 'QAzinho now',
    lines: [
      `The QA reads QAzinho in ${LANGUAGE_NAMES[app.language]}, on the theme it calls ${THEME_NAMES[app.language][app.theme]}. ${
        app.runAlert === 'system'
          ? 'A run that ends while they are away calls them with a notification and its sound.'
          : 'A run that ends calls them only inside QAzinho.'
      }`,
      SCREEN_NAMES[app.language],
      [`Their agent is ${app.agent}.`, ...integrations].join(' '),
      ...(app.projects.length === 0
        ? ['There are no projects yet.']
        : [
            'Projects:',
            ...app.projects.map((project) => {
              const parts = [
                ...project.targets.map(({ kind, value }) => `${kind} ${value}`),
                ...project.repositories.map(
                  ({ name, base }) => `repository ${name}, base ${base}`,
                ),
              ];

              return `- ${project.id} "${project.name}": ${parts.length === 0 ? 'no targets' : parts.join(' · ')}`;
            }),
          ]),
      ...(app.projects.length === 0
        ? []
        : app.workspaces.length === 0
          ? ['There are no workspaces yet.']
          : ['Workspaces:', ...app.workspaces.map(workspaceLine)]),
    ],
  };
}
