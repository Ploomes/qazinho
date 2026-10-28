import type { IProject } from '@/modules/Project/types';
import type { RunAlert } from '@/modules/Settings/types';
import type { IWorkspace, PanelTab } from '@/modules/Workspace/types';
import type {
  IAppSnapshot,
  IAppWorkspaceBrief,
  IIntegrationStatus,
  IntegrationId,
  IVariableBrief,
  Language,
} from '@/shared/types';
import type { Screen, Theme } from '@/store/AppStore/types';
import { runDayOf } from '@/modules/Run/library';
import { openRoundOf } from './openRoundOf';

const INTEGRATIONS: IntegrationId[] = ['github', 'jira'];

/**
 * O QAzinho como o assistente o lê com uma mensagem: o que está na tela, como o QA o
 * configurou, e todo projeto e workspace.
 */
export function appSnapshotOf(props: {
  screen: Screen;
  selectedWorkspaceId: string | null;
  panelTab: PanelTab | null;
  selectedRunId: string | null;
  openBugId: string | null;
  language: Language;
  theme: Theme;
  runAlert: RunAlert;
  agent: string;
  integrations: IIntegrationStatus[];
  projects: IProject[];
  workspaces: IWorkspace[];
  askingIds: string[];
  variables: Record<string, IVariableBrief[]>;
}): IAppSnapshot {
  const open = props.workspaces.find(({ id }) => id === props.selectedWorkspaceId);
  const isWorkspace = props.screen === 'workspace' && open !== undefined;

  return {
    screen: props.screen === 'settings' ? 'settings' : isWorkspace ? 'workspace' : 'home',
    openWorkspaceId: isWorkspace ? open.id : null,
    openTab: isWorkspace ? props.panelTab : null,
    openRunId:
      isWorkspace && props.panelTab === 'runs'
        ? (props.selectedRunId ?? open.runs[0]?.id ?? null)
        : null,
    openBugId: isWorkspace && props.panelTab === 'bugs' ? props.openBugId : null,
    language: props.language,
    theme: props.theme === 'dark' ? 'night' : 'paper',
    runAlert: props.runAlert,
    agent: props.agent,
    integrations: INTEGRATIONS.map((id) => ({
      id,
      account: props.integrations.find((status) => status.id === id)?.account ?? null,
    })),
    projects: props.projects.map((project) => ({
      id: project.id,
      name: project.name,
      targets: project.targets.map(({ kind, value }) => ({ kind, value })),
      repositories: project.repositories.map(({ owner, name, baseBranch }) => ({
        name: `${owner}/${name}`,
        base: baseBranch,
      })),
      variables: (props.variables[project.id] ?? []).map(({ name, description }) => ({
        name,
        description,
      })),
    })),
    workspaces: props.workspaces.map((workspace) =>
      briefOf({ workspace, projects: props.projects, askingIds: props.askingIds }),
    ),
  };
}

function briefOf(props: {
  workspace: IWorkspace;
  projects: IProject[];
  askingIds: string[];
}): IAppWorkspaceBrief {
  const { workspace } = props;
  const target =
    props.projects
      .find(({ id }) => id === workspace.projectId)
      ?.targets.find(({ id }) => id === workspace.targetId) ?? null;
  const [latest] = workspace.runs;

  return {
    id: workspace.id,
    name: workspace.name,
    projectId: workspace.projectId,
    target: target?.kind ?? null,
    cases: workspace.plan.length,
    steps: workspace.plan.reduce((total, testCase) => total + testCase.steps.length, 0),
    runs: workspace.runs.length,
    bugs: workspace.bugs.length,
    design: workspace.design?.name ?? null,
    latestRun:
      latest === undefined
        ? null
        : {
            id: latest.id,
            startedOn: runDayOf(latest),
            startedAt: latest.startedAt,
            endedBy: latest.endedBy,
            ...latest.counts,
          },
    isRunning: workspace.live !== null && !workspace.live.isDone,
    isAnswering: props.askingIds.includes(workspace.id),
    openQuestions: openRoundOf(workspace).length,
  };
}
