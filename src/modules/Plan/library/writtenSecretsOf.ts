import type { ITestCase, IWrittenSecret } from '@/modules/Plan/types';
import { passwordsIn, tokenIn } from '@/modules/Project/library';

/**
 * The passwords and tokens a plan writes out in the clear, each once, in the order the
 * plan writes them; a ${NAME} is never one.
 */
export function writtenSecretsOf(plan: ITestCase[]): IWrittenSecret[] {
  const found = plan.flatMap((testCase) =>
    [
      testCase.title,
      testCase.goal,
      testCase.preconditions,
      ...testCase.steps.flatMap(({ action, expected }) => [action, expected]),
    ].flatMap((text) => {
      const token = tokenIn(text);

      return [
        ...(token === null ? [] : [{ value: token, kind: 'token' as const }]),
        ...passwordsIn(text).map((value) => ({ value, kind: 'password' as const })),
      ].map((secret) => ({ ...secret, caseId: testCase.id }));
    }),
  );

  return found.filter(
    (secret, index) => found.findIndex(({ value }) => value === secret.value) === index,
  );
}
