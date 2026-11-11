import type { IWorkspace } from '@/modules/Workspace';
import type { IChatReference } from '@/shared/types';
import { runFactsOf } from './runFactsOf';

/**
 * Tudo num workspace que o QA pode apontar com @, as runs mais novas primeiro, com os
 * fatos de cada uma; `wholePlan` e `exploration` nomeiam uma run no idioma do QA.
 */
export function referencesOf(props: {
  workspace: Pick<IWorkspace, 'runs' | 'bugs' | 'plan'>;
  wholePlan: string;
  exploration: string;
}): IChatReference[] {
  const { workspace } = props;
  const runs = workspace.runs.map<IChatReference>((run) => ({
    kind: 'run',
    id: run.id,
    title: `${run.kind === 'explore' ? props.exploration : props.wholePlan}, ${run.startedAt}`,
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
