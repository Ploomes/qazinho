/**
 * Um id para um caso parecido com outro que nenhum caso do plano tem ainda: o número
 * seguinte, ou o id com uma contagem.
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
