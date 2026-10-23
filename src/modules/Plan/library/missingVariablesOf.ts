import type { ITestCase } from '@/modules/Plan/types';

const NAMED = /\$\{([A-Z][A-Z0-9_]*)\}/g;

/** The variables a plan types as ${NAME} that the project does not keep, each once, in the order the plan names them. */
export function missingVariablesOf(props: {
  plan: ITestCase[];
  kept: string[];
}): string[] {
  const named = props.plan.flatMap((testCase) =>
    [
      testCase.preconditions,
      ...testCase.steps.flatMap(({ action, expected }) => [action, expected]),
    ].flatMap((text) => [...text.matchAll(NAMED)].map(([, name]) => name ?? '')),
  );

  return [...new Set(named)].filter((name) => name !== '' && !props.kept.includes(name));
}
