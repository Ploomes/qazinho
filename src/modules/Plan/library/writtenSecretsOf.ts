import type { ITestCase, IWrittenSecret } from '@/modules/Plan/types';
import { secretIn } from '@/modules/Project/library';

const PASSWORD =
  /\b(?:senha|password|passwd|pwd|contraseña)\b\s*(?::|=|é|is|de|como|as)?\s*["'“”]?([^\s"'“”,;]{4,})/giu;
const LOOKS_SECRET = /[\d\W_]/u;

function passwordsIn(text: string): string[] {
  return [...text.matchAll(PASSWORD)]
    .map(([, value]) => (value ?? '').replace(/[.)]+$/u, ''))
    .filter(
      (value) => value.length >= 4 && !value.startsWith('${') && LOOKS_SECRET.test(value),
    );
}

/** The passwords and tokens a plan writes out in the clear, each once, in the order the plan writes them; a ${NAME} is never one. */
export function writtenSecretsOf(plan: ITestCase[]): IWrittenSecret[] {
  const found = plan.flatMap((testCase) =>
    [
      testCase.title,
      testCase.goal,
      testCase.preconditions,
      ...testCase.steps.flatMap(({ action, expected }) => [action, expected]),
    ].flatMap((text) => {
      const token = secretIn(text);

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
