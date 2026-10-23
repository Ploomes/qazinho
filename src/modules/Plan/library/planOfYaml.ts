import type { ITestCase, ITestStep, Priority } from '@/modules/Plan/types';
import type { StepVerdict } from '@/shared/types';
import { parse } from 'yaml';
import { nextCaseId } from './nextCaseId';

const PRIORITIES: Priority[] = ['P1', 'P2', 'P3'];
const VERDICTS: StepVerdict[] = ['passed', 'failed', 'blocked', 'skipped'];

type Loose = Record<string, unknown>;

function textOf(value: unknown): string {
  return typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : '';
}

function isLoose(value: unknown): value is Loose {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stepOf(read: Loose): ITestStep {
  const frame = textOf(read.frame);

  return {
    action: textOf(read.action),
    expected: textOf(read.expected),
    ...(frame === '' ? {} : { frame }),
  };
}

/** The cases a plan.yaml holds, each made whole: a field a QA left out by hand reads as empty, and a case with no id gets a free one. */
export function planOfYaml(yaml: string): ITestCase[] {
  let read: unknown;

  try {
    read = parse(yaml);
  } catch {
    return [];
  }

  const cases =
    isLoose(read) && Array.isArray(read.cases) ? read.cases.filter(isLoose) : [];

  return cases.reduce<ITestCase[]>((plan, testCase) => {
    const id = textOf(testCase.id).trim();
    const taken = plan.map((kept) => kept.id);
    const steps = Array.isArray(testCase.steps) ? testCase.steps.filter(isLoose) : [];

    return [
      ...plan,
      {
        id:
          id === '' || taken.includes(id)
            ? nextCaseId([...taken, ...cases.map((other) => textOf(other.id))])
            : id,
        title: textOf(testCase.title),
        priority: PRIORITIES.find((priority) => priority === testCase.priority) ?? 'P2',
        goal: textOf(testCase.goal),
        preconditions: textOf(testCase.preconditions),
        steps: steps.map(stepOf),
        lastVerdict: VERDICTS.find((verdict) => verdict === testCase.lastVerdict) ?? null,
      },
    ];
  }, []);
}
