/**
 * An id for a case like another one that no case of the plan holds yet: the next number
 * after it, or the id with a count.
 */
export function freeCaseIdOf(props: { id: string; taken: string[] }): string {
  const { id, taken } = props;
  const numbered = /^(.*?)(\d+)$/.exec(id);

  for (let step = 1; ; step += 1) {
    const candidate =
      numbered === null
        ? `${id}-${String(step + 1)}`
        : `${numbered[1] ?? ''}${String(Number(numbered[2]) + step).padStart(numbered[2]?.length ?? 0, '0')}`;

    if (!taken.includes(candidate)) return candidate;
  }
}
