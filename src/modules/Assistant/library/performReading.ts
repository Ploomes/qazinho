import type { IAppState, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { describeBug } from './describeBug';
import { describeRun } from './describeRun';
import { describeWorkspace } from './describeWorkspace';
import { findByRef } from './findByRef';

/** Reads a workspace, one of its runs or one of its bugs for the assistant, changing nothing. */
export function performReading(props: {
  call: Extract<
    AppToolCall,
    { name: 'workspace_details' | 'run_details' | 'bug_details' }
  >;
  state: IAppState;
}): IToolDone {
  const { call, state } = props;
  const found = findByRef({
    items: state.workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;

  if (call.name === 'run_details')
    return describeRun({ workspace, runId: call.args.run ?? null });

  if (call.name === 'bug_details')
    return describeBug({ workspace, bugId: call.args.bug });

  return {
    text: describeWorkspace({
      workspace,
      project: state.projects.find(({ id }) => id === workspace.projectId) ?? null,
    }),
    isError: false,
  };
}
