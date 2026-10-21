import type { ChatMessage } from '@/modules/Chat';
import type { ITestCase } from '@/modules/Plan';
import type { IRunCase, RunEnd } from '@/modules/Run';
import type { IWorkspace } from '@/modules/Workspace/types';
import { buildRun } from './buildRun';

function isSettled(props: {
  walked: IRunCase;
  testCase: ITestCase;
  reached: number;
}): boolean {
  const { walked, testCase, reached } = props;

  return (
    walked.verdict === 'failed' ||
    walked.verdict === 'blocked' ||
    reached >= testCase.steps.length
  );
}

/** Ends the run in flight however it ended: what it walked becomes a run the QA can open, an exploration's suggested plan waits in the chat, and a run that walked nothing is only stopped. */
export function endRun(props: {
  workspace: IWorkspace;
  at: string;
  endedBy: RunEnd;
}): IWorkspace {
  const { workspace, at, endedBy } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  const settled: IWorkspace = {
    ...workspace,
    live: { ...live, isRunning: false, isDone: true, doingIndex: -1, streamUrl: null },
  };

  if (live.outcomes.length === 0) return { ...settled, status: 'stopped' };

  const run = buildRun({ workspace: settled, endedBy });
  const filed = workspace.bugs.filter(({ runId }) => runId === run.id).length;

  const card: ChatMessage = {
    id: `m-${String(settled.chat.length + 1)}`,
    kind: 'run',
    at,
    runId: run.id,
    passed: run.counts.passed,
    failed: run.counts.failed,
    endedBy,
    ...(run.kind === 'explore'
      ? { explored: { screens: run.counts.passed, bugs: filed } }
      : {}),
  };
  const suggested: ChatMessage[] =
    run.suggestion === undefined || run.suggestion.cases.length === 0
      ? []
      : [
          {
            id: `m-${String(settled.chat.length + 2)}`,
            kind: 'suggestion',
            at,
            runId: run.id,
            summary: run.suggestion.summary,
            cases: run.suggestion.cases,
            isTaken: false,
          },
        ];

  const held =
    run.counts.failed + run.counts.blocked + (run.kind === 'explore' ? filed : 0);

  return {
    ...settled,
    chat: [...settled.chat, card, ...suggested],
    runs: [run, ...workspace.runs.filter(({ id }) => id !== run.id)],
    status: held > 0 ? 'failed' : endedBy === 'finished' ? 'passed' : 'stopped',
    plan: workspace.plan.map((testCase) => {
      const walked = run.cases.find(({ id }) => id === testCase.id);

      const reached = live.outcomes.filter(({ caseId }) => caseId === testCase.id).length;

      return walked && isSettled({ walked, testCase, reached })
        ? { ...testCase, lastVerdict: walked.verdict }
        : testCase;
    }),
  };
}
