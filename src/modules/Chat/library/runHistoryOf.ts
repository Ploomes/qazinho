import type { IWorkspace } from '@/modules/Workspace';
import type { IChatReference, IRunAsked } from '@/shared/types';
import { EXPLORATION } from '@/shared/constants';
import { runFactsOf } from './runFactsOf';

const DEPTH = 5;

function askedLineOf(asked: IRunAsked): string {
  const { answer } = asked;
  const where =
    asked.caseId === EXPLORATION.caseId
      ? `screen ${String(asked.stepNumber)}`
      : `${asked.caseId} step ${String(asked.stepNumber)}`;
  const ended =
    answer.kind === 'said'
      ? `they answered: ${answer.text}`
      : answer.kind === 'secret'
        ? `they typed a secret, as \${${answer.name}}${answer.isKept ? ', kept in the project' : ' for that run only'}`
        : answer.kind === 'unanswered'
          ? 'no answer came in time'
          : 'the run stopped before they answered';

  return `asked the QA at ${where}: ${asked.question} → ${ended}`;
}

/** The workspace's latest runs for its chat agent, newest first: the last one whole with the notes its agent left and what it asked the QA, the ones before by what broke. */
export function runHistoryOf(props: {
  workspace: Pick<IWorkspace, 'runs' | 'chat'>;
  wholePlan: string;
  exploration: string;
}): IChatReference[] {
  const { workspace } = props;

  return workspace.runs.slice(0, DEPTH).map((run, index) => ({
    kind: 'run',
    id: run.id,
    title: `${run.kind === 'explore' ? props.exploration : props.wholePlan} · ${run.startedAt}`,
    facts: [
      ...runFactsOf({ run, isBrief: index > 0 }),
      ...(index === 0
        ? workspace.chat.flatMap((message) =>
            message.kind === 'note' && message.runId === run.id
              ? [`note: ${message.text}`]
              : [],
          )
        : []),
      ...(index === 0 ? (run.asked ?? []).map(askedLineOf) : []),
    ],
  }));
}
