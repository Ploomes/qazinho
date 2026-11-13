import type { ITestCase } from '@/modules/Plan/types';

/**
 * Um plano como uma funcionalidade em Gherkin, montada sem IA: um cenário por caso, a
 * pré-condição como o Dado, e cada passo como um Quando e o Então dele.
 */
export function gherkinOf(props: {
  name: string;
  plan: ITestCase[];
  words: {
    language: string;
    feature: string;
    scenario: string;
    given: string;
    when: string;
    then: string;
  };
}): string {
  const { words } = props;

  return [
    `# language: ${words.language}`,
    `${words.feature}: ${props.name.trim()}`,
    ...props.plan.flatMap((testCase) => [
      '',
      `  @${testCase.priority}${testCase.isManual === true ? ' @manual' : ''}`,
      `  ${words.scenario}: ${testCase.id} ${testCase.title.trim()}`,
      ...lines(testCase.preconditions).map((line) => `    ${words.given} ${line}`),
      ...testCase.steps.flatMap(({ action, expected }) => [
        ...lines(action).map((line) => `    ${words.when} ${line}`),
        ...lines(expected).map((line) => `    ${words.then} ${line}`),
      ]),
    ]),
  ].join('\n');
}

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}
