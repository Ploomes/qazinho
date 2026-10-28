import type { ITestCase, IWrittenSecret } from '@/modules/Plan/types';
import { passwordsIn, tokenIn } from '@/modules/Project/library';

/**
 * As senhas e tokens que um plano escreve às claras, cada um uma vez, na ordem em que o
 * plano os escreve; um ${NAME} nunca é um.
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
