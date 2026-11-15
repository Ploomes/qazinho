import type { ITestCase, ITestStep, Priority } from '@/modules/Plan/types';
import type { StepVerdict } from '@/shared/types';
import { parse } from 'yaml';
import { nextCaseId } from './nextCaseId';

const PRIORITIES: Priority[] = ['P1', 'P2', 'P3'];

const VERDICTS: StepVerdict[] = ['passed', 'failed', 'blocked', 'skipped'];

type Loose = Record<string, unknown>;

/**
 * Os casos que um plan.yaml guarda, cada um inteiro: um campo de fora lê como vazio, um
 * caso sem id ganha um livre, `manual: true` vale como `isManual`, e a conta é um nome.
 */
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
        ...accountOf(testCase.signedInAs),
        steps: steps.map(stepOf),
        lastVerdict: VERDICTS.find((verdict) => verdict === testCase.lastVerdict) ?? null,
        ...(testCase.isManual === true || testCase.manual === true
          ? { isManual: true }
          : {}),
        ...textsOf({ value: testCase.sources, key: 'sources' }),
        ...textsOf({ value: testCase.blockedBy, key: 'blockedBy' }),
      },
    ];
  }, []);
}

function accountOf(value: unknown): Pick<ITestCase, 'signedInAs'> {
  const name = textOf(value).trim();

  return /^[A-Z][A-Z0-9_]*$/.test(name) ? { signedInAs: name } : {};
}

function textsOf(props: {
  value: unknown;
  key: 'sources' | 'blockedBy';
}): Partial<Record<'sources' | 'blockedBy', string[]>> {
  const texts = Array.isArray(props.value)
    ? props.value.map(textOf).filter((text) => text.trim().length > 0)
    : [];

  return texts.length === 0 ? {} : { [props.key]: texts };
}

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
