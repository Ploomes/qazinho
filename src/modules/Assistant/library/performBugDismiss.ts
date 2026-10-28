import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { findByRef } from './findByRef';

/**
 * Aceita a palavra do QA de que um bug não é bug, ou reabre um que ele tinha descartado.
 */
export function performBugDismiss(props: {
  call: Extract<AppToolCall, { name: 'dismiss_bug' }>;
  port: IAppPort;
}): IToolDone {
  const { call, port } = props;
  const found = findByRef({
    items: port.read().workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;
  const bug = workspace.bugs.find(
    ({ id }) => id.toLowerCase() === call.args.bug.trim().toLowerCase(),
  );

  if (bug === undefined)
    return {
      text:
        workspace.bugs.length === 0
          ? `${workspace.id} "${workspace.name}" has no bugs.`
          : `${workspace.id} has no bug "${call.args.bug}". Its bugs are ${workspace.bugs.map(({ id }) => id).join(', ')}.`,
      isError: true,
    };

  const isDismissed = call.args.reopen !== true;

  if (bug.isDismissed === isDismissed)
    return {
      text: isDismissed
        ? `${bug.id} was already marked as no bug.`
        : `${bug.id} was already open.`,
      isError: false,
    };

  port.dismissBug({ workspaceId: workspace.id, bugId: bug.id, isDismissed });

  return {
    text: isDismissed
      ? `${bug.id} "${bug.title}" is no longer an open bug: no run hears of it, and the Bugs tab keeps it under "not bugs".`
      : `${bug.id} "${bug.title}" is an open bug again.`,
    isError: false,
  };
}
