import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type {
  AppToolCall,
  FilingFailure,
  IssueTarget,
  IssueTracker,
} from '@/shared/types';
import { issueTargetOf } from '@/modules/Bug/library';
import { findByRef } from './findByRef';

const TRACKERS: Record<IssueTracker, string> = { jira: 'Jira', github: 'GitHub' };

const FAILURES: Record<FilingFailure, string> = {
  'not-connected':
    'it is not connected anymore. The QA connects it again in Settings → Connections.',
  unauthorized:
    'it refused the access QAzinho goes through. The QA connects it again in Settings → Connections.',
  'not-found': 'it did not find that place, or this account cannot file there.',
  unreachable: 'it is out of reach from this machine right now.',
  rejected: 'it refused the issue.',
  unexpected: 'it answered in a way QAzinho did not expect.',
};

/**
 * Manda um bug ao tracker do QA assim que ele confirma: para onde ele nomeou, senão o de
 * costume do projeto.
 */
export async function performBugSend(props: {
  id: string;
  call: Extract<AppToolCall, { name: 'send_bug' }>;
  port: IAppPort;
}): Promise<IToolDone> {
  const { id, call, port } = props;
  const state = port.read();
  const found = findByRef({
    items: state.workspaces,
    ref: call.args.workspace,
    noun: 'workspace',
  });

  if (!found.isFound) return { text: found.text, isError: true };

  const workspace = found.item;
  const bug = workspace.bugs.find(
    ({ id: bugId }) => bugId.toLowerCase() === call.args.bug.trim().toLowerCase(),
  );

  if (bug === undefined)
    return {
      text:
        workspace.bugs.length === 0
          ? `${workspace.id} "${workspace.name}" has no bugs.`
          : `${workspace.id} has no bug "${call.args.bug}". Its bugs are ${workspace.bugs.map((one) => one.id).join(', ')}.`,
      isError: true,
    };

  if (bug.filed !== null)
    return {
      text: `${bug.id} is already ${bug.filed.key} in ${TRACKERS[bug.filed.tracker]}: ${bug.filed.url}`,
      isError: false,
    };

  const trackers = state.integrations.flatMap(({ id: tracker }) =>
    tracker === 'jira' || tracker === 'github' ? [tracker] : [],
  );
  const project = state.projects.find(
    ({ id: projectId }) => projectId === workspace.projectId,
  );
  const [owner = '', name = ''] = (call.args.repository ?? '').split('/');
  const named: IssueTarget | null =
    call.args.project !== undefined
      ? { tracker: 'jira', project: call.args.project }
      : call.args.repository !== undefined
        ? { tracker: 'github', owner, name }
        : null;
  const asked = named?.tracker ?? call.args.tracker ?? null;

  if (asked !== null && !trackers.includes(asked))
    return {
      text: `${TRACKERS[asked]} is not connected, so the bug cannot go there. connect_integration starts connecting it.`,
      isError: true,
    };

  const target =
    named ??
    issueTargetOf({
      kept: project?.issueTarget ?? null,
      trackers: asked === null ? trackers : [asked],
      story: workspace.issue?.source === 'jira' ? workspace.issue.key : null,
      projects: [],
      repositories: project?.repositories ?? [],
    });

  if (target === null)
    return {
      text:
        trackers.length === 0
          ? 'Neither Jira nor GitHub is connected, so the bug has nowhere to go. connect_integration starts connecting one.'
          : 'QAzinho does not know where this project files its bugs yet. Ask the QA, then name a Jira project by its key in "project", or a repository as owner/name in "repository".',
      isError: true,
    };

  const tracker = TRACKERS[target.tracker];
  const where =
    target.tracker === 'jira'
      ? `${tracker} · ${target.project}`
      : `${tracker} · ${target.owner}/${target.name}`;
  const decision = await port.confirm({
    id,
    action: 'send_bug',
    subject: bug.id,
    count: 0,
    detail: where,
  });

  if (decision !== 'confirmed')
    return {
      text:
        decision === 'kept'
          ? `The QA did not send ${bug.id}.`
          : `The QA did not answer in time, so ${bug.id} was not sent.`,
      isError: false,
    };

  const filing = await port.sendBug({ workspaceId: workspace.id, bugId: bug.id, target });

  if (!filing.isFiled)
    return {
      text: `${bug.id} was not filed in ${where}: ${FAILURES[filing.failure]}${filing.said === '' ? '' : ` ${tracker} said: ${filing.said}`}`,
      isError: true,
    };

  return {
    text: [
      `Filed ${bug.id} as ${filing.issue.key} in ${where}: ${filing.issue.url}`,
      ...(filing.linked === null ? [] : [`It is linked to the story ${filing.linked}.`]),
      ...(filing.missed.length === 0
        ? []
        : [`${tracker} did not take ${filing.missed.join(', ')}.`]),
      ...(target.tracker === 'github'
        ? [
            "GitHub takes pictures only on its own page: the bug's card in Bugs copies its screen for the QA to paste in the issue.",
          ]
        : []),
    ].join(' '),
    isError: false,
  };
}
