import type { ITestCase } from '@/modules/Plan/types';

const NAMED = /\$\{([A-Z][A-Z0-9_]*)\}/g;

/**
 * As variáveis que um plano digita como ${NAME} ou em que um caso começa logado e que o
 * projeto não guarda, cada uma uma vez, na ordem em que o plano as nomeia.
 */
export function missingVariablesOf(props: {
  plan: ITestCase[];
  kept: string[];
}): string[] {
  const named = props.plan.flatMap((testCase) => [
    ...[
      testCase.preconditions,
      ...testCase.steps.flatMap(({ action, expected }) => [action, expected]),
    ].flatMap((text) => [...text.matchAll(NAMED)].map(([, name]) => name ?? '')),
    ...(testCase.signedInAs === undefined ? [] : [testCase.signedInAs]),
  ]);

  return [...new Set(named)].filter((name) => name !== '' && !props.kept.includes(name));
}
