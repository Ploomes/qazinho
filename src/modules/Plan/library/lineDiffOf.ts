/** As linhas que saíram e as que entraram de um texto para outro, sem espaços nas pontas. */
export function lineDiffOf(props: { before: string; after: string }): {
  removed: string[];
  added: string[];
} {
  const before = linesOf(props.before);
  const after = linesOf(props.after);
  const kept = longestCommon({ before, after });

  return {
    removed: before.filter((_line, index) => !kept.before.has(index)),
    added: after.filter((_line, index) => !kept.after.has(index)),
  };
}

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line !== '');
}

function longestCommon(props: { before: string[]; after: string[] }): {
  before: Set<number>;
  after: Set<number>;
} {
  const { before, after } = props;
  const sizes = before.map(() => after.map(() => 0));
  const sizeAt = (row: number, column: number) => sizes[row]?.[column] ?? 0;

  for (let row = before.length - 1; row >= 0; row -= 1)
    for (let column = after.length - 1; column >= 0; column -= 1) {
      const line = sizes[row];

      if (line !== undefined)
        line[column] =
          before[row] === after[column]
            ? sizeAt(row + 1, column + 1) + 1
            : Math.max(sizeAt(row + 1, column), sizeAt(row, column + 1));
    }

  const kept = { before: new Set<number>(), after: new Set<number>() };
  let row = 0;
  let column = 0;

  while (row < before.length && column < after.length) {
    if (before[row] === after[column]) {
      kept.before.add(row);
      kept.after.add(column);
      row += 1;
      column += 1;
    } else if (sizeAt(row + 1, column) >= sizeAt(row, column + 1)) row += 1;
    else column += 1;
  }

  return kept;
}
