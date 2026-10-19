import type { IWorkspace } from '@/modules/Workspace';
import type { IChatReference } from '@/shared/types';
import { runFactsOf } from './runFactsOf';

/** Everything in a workspace the QA can point at with @, newest runs first, with the facts behind each; `wholePlan` names a run in the QA's language. */
export function referencesOf(props: {
  workspace: Pick<IWorkspace, 'runs' | 'bugs' | 'plan'>;
  wholePlan: string;
}): IChatReference[] {
  const { workspace } = props;
  const runs = workspace.runs.map<IChatReference>((run) => ({
    kind: 'run',
    id: run.id,
    title: `${props.wholePlan} · ${run.startedAt}`,
    facts: runFactsOf({ run, isBrief: false }),
  }));

  const bugs = workspace.bugs.map<IChatReference>((bug) => ({
    kind: 'bug',
    id: bug.id,
    title: bug.title,
    facts: [
      `severity ${bug.severity}, caught in ${bug.runId} on ${bug.caseId} step ${String(bug.stepNumber)}`,
      `expected: ${bug.expected}`,
      `got: ${bug.got}`,
      ...(bug.body.length > 0 ? [bug.body] : []),
      ...bug.repro.map((step, index) => `repro ${String(index + 1)}: ${step.action}`),
    ],
  }));

  const cases = workspace.plan.map<IChatReference>((testCase) => ({
    kind: 'case',
    id: testCase.id,
    title: testCase.title,
    facts: [
      `priority ${testCase.priority}, last run ${testCase.lastVerdict ?? 'never'}`,
      `goal: ${testCase.goal}`,
      `before: ${testCase.preconditions}`,
      ...testCase.steps.map(
        (step, index) => `step ${String(index + 1)}: ${step.action} → ${step.expected}`,
      ),
    ],
  }));

  return [...runs, ...bugs, ...cases];
}
