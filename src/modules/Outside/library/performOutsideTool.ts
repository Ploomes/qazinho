import type { IToolDone } from '@/modules/Assistant/types';
import type { IOutsidePort } from '@/modules/Outside/types';
import type { IProject } from '@/modules/Project';
import type { IWorkspace } from '@/modules/Workspace';
import type { OutsideToolCall } from '@/shared/types';
import {
  countOf,
  describeBug,
  describeWorkspace,
  findByRef,
  newWorkspaceIn,
  projectTargetsOf,
} from '@/modules/Assistant/library';
import { OUTSIDE_SAYS, OUTSIDE_WAIT } from '@/modules/Outside/constants';
import { newProjectId } from '@/modules/Project/library';
import { flattenPlanSteps } from '@/modules/Run/library';
import { describeChatTurn } from './describeChatTurn';
import { describeRunStatus } from './describeRunStatus';
import { describeSettings } from './describeSettings';
import { describeVariables } from './describeVariables';
import { describeWorkspaces } from './describeWorkspaces';
import { isOutsideChange } from './isOutsideChange';
import { performOutsideChange } from './performOutsideChange';
import { withinWait } from './withinWait';

/**
 * Executa a chamada de um agente de fora pelos mesmos caminhos dos cliques do QA, sem
 * trazer o app à frente, e diz o que fez para o agente ler.
 */
export async function performOutsideTool(props: {
  call: OutsideToolCall;
  port: IOutsidePort;
}): Promise<IToolDone> {
  const { call, port } = props;
  const state = port.read();

  if (!state.isLoaded)
    return {
      text: 'QAzinho is still opening. Call this again in a moment.',
      isError: true,
    };

  if (call.name === 'list_workspaces')
    return { text: describeWorkspaces(state), isError: false };

  if (call.name === 'create_project') return createProject({ args: call.args, port });

  if (call.name === 'create_workspace') return createWorkspace({ args: call.args, port });

  if (isOutsideChange(call)) return performOutsideChange({ call, port });

  if (call.name === 'read_settings')
    return { text: describeSettings(state.settings), isError: false };

  if (call.name === 'list_variables') {
    const project = findByRef({
      items: state.projects,
      ref: call.args.project,
      noun: 'project',
    });

    return project.isFound
      ? {
          text: describeVariables({
            project: project.item,
            variables: state.variables[project.item.id] ?? [],
          }),
          isError: false,
        }
      : { text: project.text, isError: true };
  }

  if (call.name === 'ask_variables')
    return withinWait({
      work: port.perform(call),
      ms: OUTSIDE_WAIT.variablesMs,
      pending: OUTSIDE_SAYS.variablesOpen,
    });

  if (
    call.name === 'update_variable' ||
    call.name === 'delete_variable' ||
    call.name === 'change_settings' ||
    call.name === 'connect_integration' ||
    call.name === 'disconnect_integration'
  )
    return port.perform(call);

  const found = findByRef({
    items: state.workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;

  switch (call.name) {
    case 'workspace_details':
      return {
        text: describeWorkspace({
          workspace,
          project: state.projects.find(({ id }) => id === workspace.projectId) ?? null,
        }),
        isError: false,
      };
    case 'bug_details':
      return bugWithFiles({ workspace, bugId: call.args.bug });
    case 'stop_run':
      return stopOf({ workspace, port });
    case 'start_run':
      return startOf({ workspace, call, port });
    case 'suggest_cases':
      port.suggestCases({
        workspaceId: workspace.id,
        summary: call.args.summary,
        cases: call.args.cases,
      });

      return {
        text: `The QA sees ${countOf({ amount: call.args.cases.length, noun: 'suggested case' })} on a card in the chat of ${workspace.id} "${workspace.name}". They reach the plan only when the QA takes them, so tell them to look.`,
        isError: false,
      };
    case 'run_status':
      return statusOf({ workspaceId: workspace.id, call, port });
    case 'ask_workspace_chat':
      return askChatOf({ workspace, call, port });
    case 'read_workspace_chat':
      return chatTurnOf({
        workspaceId: workspace.id,
        waitSeconds: call.args.waitSeconds ?? 0,
        port,
      });
  }
}

function bugWithFiles(props: { workspace: IWorkspace; bugId: string }): IToolDone {
  const told = describeBug(props);

  if (told.isError) return told;

  const bug = props.workspace.bugs.find(
    ({ id }) => id.toLowerCase() === props.bugId.trim().toLowerCase(),
  );
  const files = [
    ...(bug?.shots ?? []),
    ...(bug?.sightings.map(({ shot }) => shot) ?? []),
  ].flatMap(({ file }) => (file === null ? [] : [`  ${file}`]));

  return {
    text: [
      told.text,
      ...(files.length === 0
        ? []
        : ['Its screenshots, as files you can read:', ...files]),
    ].join('\n'),
    isError: false,
  };
}

function stopOf(props: { workspace: IWorkspace; port: IOutsidePort }): IToolDone {
  const { workspace, port } = props;
  const { live } = workspace;

  if (live === null || live.isDone)
    return {
      text: `${workspace.id} "${workspace.name}" has no run going on, so there is nothing to stop.`,
      isError: false,
    };

  port.stopWorkspace(workspace.id);

  return {
    text:
      live.outcomes.length === 0
        ? `Stopped ${live.id} of ${workspace.id} "${workspace.name}" before its first step, so it leaves no run behind.`
        : `Stopped ${live.id} of ${workspace.id} "${workspace.name}".`,
    isError: false,
  };
}

function startOf(props: {
  workspace: IWorkspace;
  call: Extract<OutsideToolCall, { name: 'start_run' }>;
  port: IOutsidePort;
}): IToolDone {
  const { workspace, call, port } = props;
  const { live, plan } = workspace;

  if (live !== null && !live.isDone)
    return {
      text: `${workspace.id} is already running ${live.id}. Read it with run_status, or stop it with stop_run.`,
      isError: true,
    };

  if (plan.length === 0)
    return {
      text: `${workspace.id} "${workspace.name}" has no plan yet. The QA writes one in its chat, or you can suggest cases with suggest_cases.`,
      isError: true,
    };

  const asked = call.args.cases?.length === 0 ? undefined : call.args.cases;
  const unknown = asked?.filter((id) => !plan.some((one) => one.id === id)) ?? [];

  if (unknown.length > 0)
    return {
      text: `${workspace.id} has no case ${unknown.join(', ')}. Its cases are ${plan.map(({ id }) => id).join(', ')}.`,
      isError: true,
    };

  const runId = port.startRun({
    workspaceId: workspace.id,
    mode: call.args.withAgent === true ? 'agent' : 'replay',
    ...(asked === undefined ? {} : { caseIds: asked }),
  });

  if (runId === null)
    return {
      text: `QAzinho could not start a run of ${workspace.id}. The QA can see why in the app.`,
      isError: true,
    };

  const steps = flattenPlanSteps(plan).filter(
    ({ caseId }) => asked === undefined || asked.includes(caseId),
  ).length;

  return {
    text: `Started ${runId} of ${workspace.id} "${workspace.name}": ${countOf({ amount: asked?.length ?? plan.length, noun: 'case' })}, ${countOf({ amount: steps, noun: 'step' })}. It goes on by itself: read it with run_status and waitSeconds.`,
    isError: false,
  };
}

async function statusOf(props: {
  workspaceId: string;
  call: Extract<OutsideToolCall, { name: 'run_status' }>;
  port: IOutsidePort;
}): Promise<IToolDone> {
  const { workspaceId, call, port } = props;
  const waitSeconds = call.args.waitSeconds ?? 0;

  if (waitSeconds > 0) await port.waitForRun({ workspaceId, ms: waitSeconds * 1_000 });

  const workspace = port.read().workspaces.find(({ id }) => id === workspaceId);

  if (workspace === undefined)
    return { text: `The workspace ${workspaceId} is gone.`, isError: true };

  const wanted = call.args.run ?? null;
  const isGoing =
    workspace.live !== null &&
    !workspace.live.isDone &&
    (wanted === null || wanted.toLowerCase() === workspace.live.id);
  const runId = wanted ?? workspace.runs[0]?.id ?? null;
  const network =
    isGoing || runId === null ? null : await port.networkOf({ workspaceId, runId });

  return describeRunStatus({ workspace, runId: wanted, network, now: port.now() });
}

function createProject(props: {
  args: Extract<OutsideToolCall, { name: 'create_project' }>['args'];
  port: IOutsidePort;
}): IToolDone {
  const { args, port } = props;
  const read = projectTargetsOf({ values: args, labelOf: port.targetLabel });

  if (!read.isOk) return { text: read.text, isError: true };

  const project: IProject = {
    id: newProjectId(port.now()),
    name: args.name,
    targets: read.targets,
    repositories: [],
  };

  port.putProject(project);

  return {
    text: `Created project ${project.id} "${project.name}" on ${read.targets.map(({ kind, value }) => `${kind} ${value}`).join(', ')}. Create a workspace in it with create_workspace.`,
    isError: false,
  };
}

function createWorkspace(props: {
  args: Extract<OutsideToolCall, { name: 'create_workspace' }>['args'];
  port: IOutsidePort;
}): IToolDone {
  const { args, port } = props;
  const found = findByRef({
    items: port.read().projects,
    ref: args.project,
    noun: 'project',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const made = newWorkspaceIn({
    project: found.item,
    name: args.name,
    kind: args.target,
    now: port.now(),
  });

  if (!made.isOk) return { text: made.text, isError: true };

  port.addWorkspace(made.workspace);

  return {
    text: `Created workspace ${made.workspace.id} "${made.workspace.name}" in ${found.item.id} on ${made.target.kind}. Its plan is empty: suggest its first cases with suggest_cases, and tell the QA to take them to the plan in QAzinho before you run it.`,
    isError: false,
  };
}

async function askChatOf(props: {
  workspace: IWorkspace;
  call: Extract<OutsideToolCall, { name: 'ask_workspace_chat' }>;
  port: IOutsidePort;
}): Promise<IToolDone> {
  const { workspace, call, port } = props;
  const named = `${workspace.id} "${workspace.name}"`;

  if (workspace.live !== null && !workspace.live.isDone)
    return {
      text: `${named} is running ${workspace.live.id}; its chat takes messages again once the run ends. Wait for it with run_status.`,
      isError: true,
    };

  if (port.read().askingIds.includes(workspace.id))
    return {
      text: `QAzinho's agent in the chat of ${named} is still answering. Read it with read_workspace_chat and waitSeconds, then write again.`,
      isError: true,
    };

  port.askChat({ workspaceId: workspace.id, text: call.args.text });

  return chatTurnOf({
    workspaceId: workspace.id,
    waitSeconds: call.args.waitSeconds ?? 0,
    port,
  });
}

async function chatTurnOf(props: {
  workspaceId: string;
  waitSeconds: number;
  port: IOutsidePort;
}): Promise<IToolDone> {
  const { workspaceId, waitSeconds, port } = props;

  if (waitSeconds > 0) await port.waitForChat({ workspaceId, ms: waitSeconds * 1_000 });

  const state = port.read();
  const workspace = state.workspaces.find(({ id }) => id === workspaceId);

  if (workspace === undefined)
    return { text: `The workspace ${workspaceId} is gone.`, isError: true };

  return describeChatTurn({
    workspace,
    isAnswering: state.askingIds.includes(workspaceId),
  });
}
