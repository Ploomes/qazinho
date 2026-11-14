/** O commit em que uma branch está, pela resposta do GitHub sobre ela; null se nenhum. */
export function shaOfBranch(text: string): string | null {
  try {
    const { commit } = JSON.parse(text) as { commit?: { sha?: unknown } };

    return typeof commit?.sha === 'string' ? commit.sha : null;
  } catch {
    return null;
  }
}
