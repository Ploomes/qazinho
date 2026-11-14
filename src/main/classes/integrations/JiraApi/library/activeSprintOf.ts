/** A sprint aberta de um board, a que começou por último quando há mais de uma. */
export function activeSprintOf(body: unknown): { id: number; name: string } | null {
  const { values } = (body ?? {}) as { values?: unknown };
  const open = (Array.isArray(values) ? values : []).flatMap((value) => {
    const { id, name, state, startDate } = (value ?? {}) as {
      id?: unknown;
      name?: unknown;
      state?: unknown;
      startDate?: unknown;
    };

    return typeof id === 'number' && typeof name === 'string' && state === 'active'
      ? [{ id, name: name.trim(), start: typeof startDate === 'string' ? startDate : '' }]
      : [];
  });
  const [latest] = open.sort((a, b) => b.start.localeCompare(a.start));

  return latest === undefined ? null : { id: latest.id, name: latest.name };
}
