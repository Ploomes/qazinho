import type { ITestCase } from '@/modules/Plan/types';
import type { IDraftedCase } from '@/shared/types';

/** The cases the agent drafted, numbered for the plan; null when none has a title and a step to run. */
export function planOfDraft(cases: IDraftedCase[]): ITestCase[] | null {
  const plan = cases.flatMap<ITestCase>((one, index) => {
    const steps = one.steps
      .map((step) => ({ action: step.action.trim(), expected: step.expected.trim() }))
      .filter((step) => step.action.length > 0 && step.expected.length > 0);

    if (one.title.trim().length === 0 || steps.length === 0) return [];

    return [
      {
        id: `TC-${String(index + 1).padStart(2, '0')}`,
        title: one.title.trim(),
        priority: one.priority,
        goal: one.goal.trim(),
        preconditions: one.preconditions.trim(),
        steps,
        lastVerdict: null,
      },
    ];
  });

  return plan.length === 0 ? null : plan;
}
