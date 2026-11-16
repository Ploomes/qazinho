/** Se uma versão vem antes (negativo), junto (zero) ou depois (positivo) de outra. */
export function compareVersions(first: string, second: string): number {
  const one = partsOf(first);
  const two = partsOf(second);

  for (let index = 0; index < 3; index += 1) {
    const difference = (one[index] ?? 0) - (two[index] ?? 0);

    if (difference !== 0) return difference;
  }

  return 0;
}

function partsOf(version: string): number[] {
  return (
    version
      .split('-')[0]
      ?.split('.')
      .map((part) => Number.parseInt(part, 10) || 0) ?? []
  );
}
