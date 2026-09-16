import type { ITestCase, Priority } from '@/modules/Plan/types';

const PRIORITIES = ['P1', 'P2', 'P3'];

type Drafted = {
  summary?: unknown;
  cases?: {
    title?: unknown;
    priority?: unknown;
    goal?: unknown;
    preconditions?: unknown;
    steps?: { action?: unknown; expected?: unknown }[];
  }[];
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** The agent answers in the schema's shape, but a plan the QA cannot read is worth nothing. */
export function parseDraftedPlan(
  answer: string,
): { summary: string; plan: ITestCase[] } | null {
  let drafted: Drafted;

  try {
    drafted = JSON.parse(answer) as Drafted;
  } catch {
    return null;
  }

  const plan = (drafted.cases ?? []).flatMap<ITestCase>((one, index) => {
    const steps = (one.steps ?? [])
      .map((step) => ({ action: text(step.action), expected: text(step.expected) }))
      .filter((step) => step.action.length > 0 && step.expected.length > 0);

    if (text(one.title).length === 0 || steps.length === 0) return [];

    const priority = text(one.priority);

    return [
      {
        id: `TC-${String(index + 1).padStart(2, '0')}`,
        title: text(one.title),
        priority: (PRIORITIES.includes(priority) ? priority : 'P2') as Priority,
        goal: text(one.goal),
        preconditions: text(one.preconditions),
        steps,
        lastVerdict: null,
      },
    ];
  });

  if (plan.length === 0) return null;

  return { summary: text(drafted.summary), plan };
}
