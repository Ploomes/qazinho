import type { IToolDone } from '@/modules/Assistant/types';
import type { IOutsidePort } from '@/modules/Outside/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { OutsideToolCall } from '@/shared/types';
import { countOf, findByRef } from '@/modules/Assistant/library';
import { caseIdsUsed, planWithCases } from '@/modules/Plan/library';

type ChangeCall = Extract<
  OutsideToolCall,
  {
    name:
      | 'update_project'
      | 'delete_project'
      | 'rename_workspace'
      | 'delete_workspace'
      | 'explore_app'
      | 'dismiss_bug'
      | 'send_bug'
      | 'add_cases'
      | 'update_cases'
      | 'delete_cases';
  }
>;

/**
 * Muda o que o QA tem a pedido de um agente de fora, que já perguntou ao usuário no chat
 * dele antes de mudar ou apagar.
 */
export async function performOutsideChange(props: {
  call: ChangeCall;
  port: IOutsidePort;
}): Promise<IToolDone> {
  const { call, port } = props;

  if (call.name === 'delete_project') return port.perform(call);

  if (call.name === 'update_project') return updateProject({ call, port });

  const found = findByRef({
    items: port.read().workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;

  switch (call.name) {
    case 'delete_workspace':
    case 'explore_app':
    case 'send_bug':
    case 'rename_workspace':
    case 'dismiss_bug':
      return port.perform(call);
    case 'add_cases':
      return addCases({ workspace, call, port });
    case 'update_cases':
      return updateCases({ workspace, call, port });
    case 'delete_cases':
      return deleteCases({ workspace, call, port });
  }
}

function updateProject(props: {
  call: Extract<ChangeCall, { name: 'update_project' }>;
  port: IOutsidePort;
}): Promise<IToolDone> | IToolDone {
  const { call, port } = props;
  const found = findByRef({
    items: port.read().projects,
    ref: call.args.project,
    noun: 'project',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  if (
    [call.args.name, call.args.web, call.args.android, call.args.ios].every(
      (value) => value === undefined,
    )
  )
    return { text: 'Name what changes: name, web, android or ios.', isError: true };

  return port.perform(call);
}

function addCases(props: {
  workspace: IWorkspace;
  call: Extract<ChangeCall, { name: 'add_cases' }>;
  port: IOutsidePort;
}): IToolDone {
  const { workspace, call, port } = props;
  const busy = busyOf(workspace);

  if (busy !== null) return busy;

  const taken = call.args.cases.flatMap(({ id }) =>
    id !== undefined && workspace.plan.some((one) => one.id === id) ? [id] : [],
  );

  if (taken.length > 0)
    return {
      text: `${taken.join(', ')} already ${taken.length === 1 ? 'is a case' : 'are cases'} of the plan: change ${taken.length === 1 ? 'it' : 'them'} with update_cases, or leave the id out for a new case.`,
      isError: true,
    };

  return landPlan({
    workspace,
    cases: call.args.cases.map(({ id: _id, ...rest }) => rest),
    port,
    said: 'Added',
  });
}

function updateCases(props: {
  workspace: IWorkspace;
  call: Extract<ChangeCall, { name: 'update_cases' }>;
  port: IOutsidePort;
}): IToolDone {
  const { workspace, call, port } = props;
  const busy = busyOf(workspace);

  if (busy !== null) return busy;

  const ids = call.args.cases.map(({ id }) => id ?? '');
  const unknown = ids.filter((id) => !workspace.plan.some((one) => one.id === id));

  if (unknown.length > 0)
    return {
      text: `Each case needs the id of the one it replaces. ${unknown.some((id) => id === '') ? 'A case has no id' : `The plan has no ${unknown.join(', ')}`}: its cases are ${planIds(workspace)}. A new case goes in with add_cases.`,
      isError: true,
    };

  return landPlan({ workspace, cases: call.args.cases, port, said: 'Changed' });
}

function deleteCases(props: {
  workspace: IWorkspace;
  call: Extract<ChangeCall, { name: 'delete_cases' }>;
  port: IOutsidePort;
}): IToolDone {
  const { workspace, call, port } = props;
  const busy = busyOf(workspace);

  if (busy !== null) return busy;

  const ids = call.args.cases.map((id) => id.toUpperCase());
  const unknown = ids.filter((id) => !workspace.plan.some((one) => one.id === id));

  if (unknown.length > 0)
    return {
      text: `The plan has no ${unknown.join(', ')}. Its cases are ${planIds(workspace)}.`,
      isError: true,
    };

  const plan = workspace.plan.filter(({ id }) => !ids.includes(id));

  port.changePlan({ workspaceId: workspace.id, plan });

  return {
    text: `Deleted ${ids.join(', ')} from ${workspace.id} "${workspace.name}". Its plan has ${countOf({ amount: plan.length, noun: 'case' })}.`,
    isError: false,
  };
}

function landPlan(props: {
  workspace: IWorkspace;
  cases: Extract<ChangeCall, { name: 'add_cases' }>['args']['cases'];
  port: IOutsidePort;
  said: 'Added' | 'Changed';
}): IToolDone {
  const { workspace, cases, port, said } = props;
  const plan = planWithCases({
    plan: workspace.plan,
    cases,
    used: caseIdsUsed(workspace),
  });
  const before = new Set(workspace.plan.map(({ id }) => id));
  const touched =
    plan?.filter((one) => !before.has(one.id) || cases.some(({ id }) => id === one.id)) ??
    [];

  if (plan === null || touched.length === 0)
    return {
      text: 'No case had a title and at least one step with an action and what to see.',
      isError: true,
    };

  port.changePlan({ workspaceId: workspace.id, plan });

  return {
    text: `${said} ${touched.map(({ id, title }) => `${id} "${title}"`).join(', ')} in ${workspace.id} "${workspace.name}". Its plan has ${countOf({ amount: plan.length, noun: 'case' })}; run them with start_run.`,
    isError: false,
  };
}

function busyOf(workspace: IWorkspace): IToolDone | null {
  return workspace.live !== null && !workspace.live.isDone
    ? {
        text: `${workspace.id} is running ${workspace.live.id}; its plan changes once the run ends.`,
        isError: true,
      }
    : null;
}

function planIds(workspace: IWorkspace): string {
  return workspace.plan.length === 0
    ? 'none yet'
    : workspace.plan.map(({ id }) => id).join(', ');
}
