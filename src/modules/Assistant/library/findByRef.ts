/**
 * O item que uma referência nomeia, pelo id ou senão pelo nome sem caixa; uma que não
 * nomeia nenhum ou vários diz isso, listando o que há.
 */
export function findByRef<T extends { id: string; name: string }>(props: {
  items: T[];
  ref: string;
  noun: string;
}): { isFound: true; item: T } | { isFound: false; text: string } {
  const ref = props.ref.trim();
  const byId = props.items.find(({ id }) => id === ref);

  if (byId) return { isFound: true, item: byId };

  const named = props.items.filter(
    ({ name }) => name.trim().toLowerCase() === ref.toLowerCase(),
  );
  const [only] = named;

  if (named.length === 1 && only !== undefined) return { isFound: true, item: only };

  if (named.length > 1)
    return {
      isFound: false,
      text: `${String(named.length)} ${props.noun}s are called "${ref}": ${named.map(({ id }) => id).join(', ')}. Name one by its id.`,
    };

  if (props.items.length === 0)
    return { isFound: false, text: `There is no ${props.noun} yet.` };

  return {
    isFound: false,
    text: `There is no ${props.noun} "${ref}". The ${props.noun}s are ${props.items
      .map(({ id, name }) => `${id} "${name}"`)
      .join(', ')}.`,
  };
}
