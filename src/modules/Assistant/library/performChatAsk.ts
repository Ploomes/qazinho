import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { findByRef } from './findByRef';

/** Hands the QA's request to a workspace's own chat, as if they typed it there, and opens that chat. */
export function performChatAsk(props: {
  call: Extract<AppToolCall, { name: 'ask_workspace_chat' }>;
  port: IAppPort;
}): IToolDone {
  const { call, port } = props;
  const state = port.read();
  const found = findByRef({
    items: state.workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;
  const named = `${workspace.id} "${workspace.name}"`;

  if (workspace.live !== null && !workspace.live.isDone)
    return {
      text: `${named} is running ${workspace.live.id}, and its chat takes messages again once the run ends.`,
      isError: true,
    };

  if (state.askingIds.includes(workspace.id))
    return {
      text: `The agent of ${named} is still answering in its chat: let it finish before asking it again.`,
      isError: true,
    };

  port.askWorkspaceChat({ workspaceId: workspace.id, text: call.args.text });

  return {
    text: `Sent the message to the chat of ${named} and opened it there. Its agent answers in that chat, not here: before a plan it looks at the app and may ask the QA a round of questions, which they answer there.`,
    isError: false,
  };
}
