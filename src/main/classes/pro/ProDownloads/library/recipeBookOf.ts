/** The org's recordings of a plan as a workspace's recipe book, so its cases walk again without the agent here too. */
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
