import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { AppToolCall } from '@/shared/types';
import { toPlanKind } from '@/modules/Plan/library';
import { flattenPlanSteps } from '@/modules/Run/library';
import { designLinkOf } from '@/modules/Workspace/library';
import { EXPLORATION } from '@/shared/constants';
import { findByRef } from './findByRef';

type WorkspaceCall = Extract<
  AppToolCall,
  {
    name:
      | 'create_workspace'
      | 'rename_workspace'
      | 'link_design'
      | 'unlink_design'
      | 'run_plan'
      | 'explore_app'
      | 'stop_run';
  }
>;

function failed(text: string): IToolDone {
  return { text, isError: true };
}

function createWorkspace(props: {
  args: Extract<WorkspaceCall, { name: 'create_workspace' }>['args'];
  port: IAppPort;
}): IToolDone {
  const { args, port } = props;
  const found = findByRef({
    items: port.read().projects,
    ref: args.project,
    noun: 'project',
  });

  if (!found.isFound) return failed(found.text);

  const project = found.item;
  const kinds = project.targets.map(({ kind }) => kind).join(', ');
  const [only] = project.targets;
  const target =
    args.target === undefined
      ? project.targets.length === 1
        ? only
        : undefined
      : project.targets.find(({ kind }) => kind === args.target);

  if (target === undefined)
    return failed(
      args.target === undefined
        ? `${project.id} tests on ${kinds}: say which target the workspace is for.`
        : `${project.id} has no ${args.target} target. Its targets are ${kinds}.`,
    );

  const workspace: IWorkspace = {
    id: `w-${String(port.now())}`,
    projectId: project.id,
    name: args.name,
    targetId: target.id,
    planKind: toPlanKind(target.kind),
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
    viewportId: 'desktop',
    context: null,
  };

  port.addWorkspace(workspace);

  return {
    text: `Created workspace ${workspace.id} "${workspace.name}" in ${project.id} on ${target.kind}, and opened it on its chat, where its agent writes the plan with the QA.`,
    isError: false,
  };
}

/** Creates, renames, runs or stops a workspace, or links its Figma design, the way the QA's own clicks do. */
export function performWorkspaceChange(props: {
  call: WorkspaceCall;
  port: IAppPort;
}): IToolDone {
  const { call, port } = props;

  if (call.name === 'create_workspace') return createWorkspace({ args: call.args, port });

  const state = port.read();
  const found = findByRef({
    items: state.workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return failed(found.text);

  const workspace = found.item;
  const live = workspace.live !== null && !workspace.live.isDone ? workspace.live : null;

  if (call.name === 'rename_workspace') {
    port.renameWorkspace({ workspaceId: workspace.id, name: call.args.name });

    return {
      text: `Renamed ${workspace.id} from "${workspace.name}" to "${call.args.name}".`,
      isError: false,
    };
  }

  if (call.name === 'link_design') {
    const design = designLinkOf(call.args.link);

    if (design === null)
      return failed(
        `"${call.args.link}" is not a link to a Figma design. The QA copies it in Figma from a frame or page, with Copy link.`,
      );

    port.setDesign({ workspaceId: workspace.id, design });

    return {
      text: `${workspace.id} "${workspace.name}" is now checked against the Figma design "${design.name}"${design.nodeId === null ? ', the whole file' : `, from node ${design.nodeId}`}. Its chat reads it through the QA's own Figma when it plans, and each run holds the steps that name a frame to it. Its header opens it in Figma.`,
      isError: false,
    };
  }

  if (call.name === 'unlink_design') {
    if (workspace.design === null)
      return {
        text: `${workspace.id} "${workspace.name}" has no Figma design to unlink.`,
        isError: false,
      };

    port.setDesign({ workspaceId: workspace.id, design: null });

    return {
      text: `${workspace.id} "${workspace.name}" is no longer checked against "${workspace.design.name}". Its plan keeps the frames its steps name.`,
      isError: false,
    };
  }

  if (call.name === 'stop_run') {
    if (live === null)
      return {
        text: `${workspace.id} "${workspace.name}" has no run going on, so there is nothing to stop.`,
        isError: false,
      };

    port.stopWorkspace(workspace.id);

    return {
      text: `Stopped ${live.id} of ${workspace.id} "${workspace.name}".`,
      isError: false,
    };
  }

  const steps = flattenPlanSteps(workspace.plan).length;
  const target =
    state.projects
      .find(({ id }) => id === workspace.projectId)
      ?.targets.find(({ id }) => id === workspace.targetId) ?? null;

  if (call.name === 'explore_app') {
    if (live !== null) return failed(`${workspace.id} is already running ${live.id}.`);

    if (target === null)
      return failed(
        `The target ${workspace.id} tests on is gone from its project: give the project that target again, or make a new workspace.`,
      );

    const runId = port.exploreWorkspace(workspace.id);

    if (runId === null) return failed('QAzinho could not start the exploration.');

    return {
      text: `Started exploration ${runId} of ${workspace.id} "${workspace.name}" on ${target.kind}, on screen now. It goes on by itself for ${String(EXPLORATION.minutes)} minutes, and leaves a suggested plan in the workspace's chat.`,
      isError: false,
    };
  }

  if (steps === 0)
    return failed(
      `${workspace.id} "${workspace.name}" has no plan to run yet: its chat writes one with the QA.`,
    );

  if (live !== null) return failed(`${workspace.id} is already running ${live.id}.`);

  if (target === null)
    return failed(
      `The target ${workspace.id} tests on is gone from its project: give the project that target again, or make a new workspace.`,
    );

  const runId = port.runWorkspace(workspace.id);

  if (runId === null) return failed('QAzinho could not start the run.');

  return {
    text: `Started ${runId} of ${workspace.id} "${workspace.name}": ${String(steps)} steps on ${target.kind}, on screen now. It goes on by itself, and the QA hears when it ends.`,
    isError: false,
  };
}
