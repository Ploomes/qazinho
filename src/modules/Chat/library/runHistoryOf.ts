import type { IWorkspace } from '@/modules/Workspace';
import type { IChatReference, IRunAsked } from '@/shared/types';
import { EXPLORATION } from '@/shared/constants';
import { runFactsOf } from './runFactsOf';

const DEPTH = 5;

/**
 * As últimas runs do workspace para o agente do chat, as mais novas primeiro: a última
 * inteira com as notas e o que perguntou ao QA, as anteriores pelo que quebrou.
 */
export function runHistoryOf(props: {
  workspace: Pick<IWorkspace, 'runs' | 'chat'>;
  wholePlan: string;
  exploration: string;
}): IChatReference[] {
  const { workspace } = props;

  return workspace.runs.slice(0, DEPTH).map((run, index) => ({
    kind: 'run',
    id: run.id,
    title: `${run.kind === 'explore' ? props.exploration : props.wholePlan}, ${run.startedAt}`,
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
