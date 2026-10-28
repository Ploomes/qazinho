/**
 * As gravações da org de um plano como o livro de receitas de um workspace, para os casos
 * dele andarem sem o agente aqui também.
 */
export function recipeBookOf(
  recordings: {
    caseId: string;
    fingerprint: string;
    targetKind: string;
    steps: unknown[];
    recordedAt: string;
  }[],
) {
  return {
    cases: recordings.map(({ caseId, fingerprint, targetKind, steps, recordedAt }) => {
      const at = Date.parse(recordedAt);

      return {
        caseId,
        fingerprint,
        targetKind,
        steps,
        runId: 'org',
        recordedAt: Number.isNaN(at) ? 0 : at,
      };
    }),
  };
}
