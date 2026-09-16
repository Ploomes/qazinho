import type { ChatMessage } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { buildRun } from './buildRun';

/** The device is closed: what the run decided becomes a run the QA can open. */
export function finishRun(props: { workspace: IWorkspace; at: string }): IWorkspace {
  const { workspace, at } = props;
  const { live } = workspace;

  if (!live || live.isDone) return workspace;

  const settled: IWorkspace = {
    ...workspace,
    live: { ...live, isRunning: false, isDone: true, doingIndex: -1 },
  };

  if (live.outcomes.length === 0) return { ...settled, status: 'stopped' };

  const run = buildRun(settled);

  const card: ChatMessage = {
    id: `m-${String(settled.chat.length + 1)}`,
    kind: 'run',
    at,
    runId: run.id,
    passed: run.counts.passed,
    failed: run.counts.failed,
  };

  const held = run.counts.failed + run.counts.blocked;

  return {
    ...settled,
    chat: [...settled.chat, card],
    runs: [run, ...workspace.runs],
    status: held > 0 ? 'failed' : 'passed',
    plan: workspace.plan.map((testCase) => {
      const walked = run.cases.find(({ id }) => id === testCase.id);

      return walked ? { ...testCase, lastVerdict: walked.verdict } : testCase;
    }),
  };
}
