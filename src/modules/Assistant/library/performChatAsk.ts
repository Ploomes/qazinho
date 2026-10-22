import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall, JiraFailure } from '@/shared/types';
import { findByRef } from './findByRef';
import { openRoundOf } from './openRoundOf';

const STORY_REFUSALS: Record<JiraFailure, string> = {
  'not-connected':
    'Jira is not connected, so QAzinho cannot read the story. The QA connects it in Settings → Integrations.',
  unauthorized:
    'Jira refused the token QAzinho keeps. The QA connects Jira again in Settings → Integrations.',
  'not-found': 'Jira did not find that story, or this account cannot see it.',
  unreachable: 'Jira is out of reach from this machine right now.',
  rejected: 'Jira refused to hand the story over.',
  unexpected: 'Jira answered in a way QAzinho did not expect.',
};

/** Hands the QA's request to a workspace's own chat, as if they typed it there, with the Jira story it plans from, and opens that chat. */
export async function performChatAsk(props: {
  call: Extract<AppToolCall, { name: 'ask_workspace_chat' }>;
  port: IAppPort;
}): Promise<IToolDone> {
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
      text: `The agent of ${named} is still answering in its chat. You cannot send this later on your own: tell the QA to write it there once the agent is done, or to ask you again then.`,
      isError: true,
    };

  const round = openRoundOf(workspace);

  if (round.length > 0)
    return {
      text: `The agent of ${named} asked the QA ${round.length === 1 ? 'a question' : `${String(round.length)} questions`} in its chat that they have not answered yet, and a new message would leave ${round.length === 1 ? 'it' : 'them'} behind. Tell the QA to answer there: each question takes their own words too, where this request fits.`,
      isError: true,
    };

  const key = call.args.story;
  const story = key === undefined ? null : await port.findStory(key);

  if (typeof story === 'string')
    return { text: `${key ?? ''}: ${STORY_REFUSALS[story]}`, isError: true };

  port.askWorkspaceChat({ workspaceId: workspace.id, text: call.args.text, story });

  return {
    text: `Sent the message to the chat of ${named}${story === null ? '' : `, with the Jira story ${story.key} "${story.summary}",`} and opened it there. Its agent answers in that chat, not here: before a plan it looks at the app and may ask the QA a round of questions, which they answer there.`,
    isError: false,
  };
}
