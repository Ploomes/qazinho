/**
 * As receitas de um workspace, como guardadas no recipes.json dele, viradas nas gravações
 * que a plataforma guarda para uma branch; null quando não há nenhuma para ler.
 */
export function recordingsBodyOf(props: { text: string | null; branch: string }) {
  const { text, branch } = props;

  if (text === null) return null;

  try {
    const book = JSON.parse(text) as { cases?: unknown };

    if (!Array.isArray(book.cases)) return null;

    const recordings = book.cases.flatMap((one: unknown) => {
      if (typeof one !== 'object' || one === null) return [];

      const recipe = one as Record<string, unknown>;

      if (typeof recipe.caseId !== 'string' || typeof recipe.fingerprint !== 'string')
        return [];

      return [
        {
          caseId: recipe.caseId,
          fingerprint: recipe.fingerprint,
          targetKind: recipe.targetKind,
          steps: Array.isArray(recipe.steps) ? recipe.steps : [],
          recordedAt: new Date(
            typeof recipe.recordedAt === 'number' ? recipe.recordedAt : 0,
          ).toISOString(),
        },
      ];
    });

    return { branch, recordings };
  } catch {
    return null;
  }
}
