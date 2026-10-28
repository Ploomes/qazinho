/** Quantos arquivos um diff unificado toca: um por cabeçalho diff --git. */
export function filesInDiff(diff: string): number {
  return diff.match(/^diff --git /gm)?.length ?? 0;
}
