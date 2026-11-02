import type { IToolDone } from '@/modules/Assistant/types';
import type { IOutsidePort } from '@/modules/Outside/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { OutsideToolCall } from '@/shared/types';
import {
  countOf,
  describeBug,
  describeWorkspace,
  findByRef,
} from '@/modules/Assistant/library';
import { flattenPlanSteps } from '@/modules/Run/library';
import { describeRunStatus } from './describeRunStatus';
import { describeWorkspaces } from './describeWorkspaces';

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
