import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { findByRef } from './findByRef';

/** Deletes a workspace, or a project with every workspace in it, once the QA confirms it on screen. */
export async function performRemoval(props: {
  id: string;
  call: Extract<AppToolCall, { name: 'delete_workspace' | 'delete_project' }>;
  port: IAppPort;
}): Promise<IToolDone> {
  const { id, call, port } = props;
  const state = port.read();

  if (call.name === 'delete_workspace') {
    const found = findByRef({
      items: state.workspaces,
      ref: call.args.workspace,
      noun: 'workspace',
    });

    if (!found.isFound) return { text: found.text, isError: true };

    const workspace = found.item;
    const decision = await port.confirm({
      id,
      action: 'delete_workspace',
      subject: workspace.name,
      count: 0,
    });

    if (decision !== 'confirmed')
      return {
        text:
          decision === 'kept'
            ? `The QA kept ${workspace.id} "${workspace.name}".`
            : `The QA did not answer in time, so ${workspace.id} is still there.`,
        isError: false,
      };

    port.removeWorkspace(workspace.id);

    return {
      text: `Deleted ${workspace.id} "${workspace.name}" with its chat, plan, runs and bugs.`,
      isError: false,
    };
  }

  const found = findByRef({
    items: state.projects,
    ref: call.args.project,
    noun: 'project',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const project = found.item;
  const count = state.workspaces.filter(
    ({ projectId }) => projectId === project.id,
  ).length;
  const decision = await port.confirm({
    id,
    action: 'delete_project',
    subject: project.name,
    count,
  });

  if (decision !== 'confirmed')
    return {
      text:
        decision === 'kept'
          ? `The QA kept ${project.id} "${project.name}".`
          : `The QA did not answer in time, so ${project.id} is still there.`,
      isError: false,
    };

  port.removeProject(project.id);

  return {
    text: `Deleted ${project.id} "${project.name}"${count === 0 ? '' : ` and its ${String(count)} workspace${count === 1 ? '' : 's'}`}.`,
    isError: false,
  };
}
